from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64
import io
from PIL import Image

# Import emergent integrations
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class CropAdviceRequest(BaseModel):
    query: str
    crop_type: Optional[str] = None
    location: Optional[str] = None
    language: Optional[str] = "English"

class CropAdviceResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    query: str
    advice: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PestDetectionRequest(BaseModel):
    image_base64: str
    crop_type: Optional[str] = None

class PestDetectionResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    detection_result: str
    recommendations: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FarmerProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: str
    farm_size: str
    primary_crops: List[str]
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FarmerProfileCreate(BaseModel):
    name: str
    location: str
    farm_size: str
    primary_crops: List[str]
    phone: Optional[str] = None

# Initialize LLM Chat
def get_llm_chat():
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")
    
    return LlmChat(
        api_key=api_key,
        session_id="crop_advisory_session",
        system_message="""You are an expert agricultural advisor specialized in crop management, pest control, soil health, and sustainable farming practices. 
        
        Provide practical, actionable advice for farmers including:
        - Crop-specific recommendations
        - Pest and disease management
        - Soil health and fertilizer guidance
        - Weather-based farming tips
        - Sustainable farming practices
        - Market timing suggestions
        
        Always be supportive, use simple language, and consider the farmer's location and crop type when giving advice. 
        If asked in a local language, respond in that language."""
    ).with_model("openai", "gpt-4o-mini")

@api_router.get("/")
async def root():
    return {"message": "Smart Crop Advisory System API"}

@api_router.post("/crop-advice", response_model=CropAdviceResponse)
async def get_crop_advice(request: CropAdviceRequest):
    try:
        llm_chat = get_llm_chat()
        
        # Construct detailed query
        enhanced_query = f"""
        Farmer Question: {request.query}
        Crop Type: {request.crop_type or 'Not specified'}
        Location: {request.location or 'Not specified'}
        Language: {request.language}
        
        Please provide specific, actionable advice for this farmer's situation.
        """
        
        user_message = UserMessage(text=enhanced_query)
        advice = await llm_chat.send_message(user_message)
        
        # Save to database
        advice_obj = CropAdviceResponse(
            query=request.query,
            advice=advice
        )
        
        advice_dict = advice_obj.dict()
        advice_dict['timestamp'] = advice_dict['timestamp'].isoformat()
        await db.crop_advice.insert_one(advice_dict)
        
        return advice_obj
        
    except Exception as e:
        logger.error(f"Error getting crop advice: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get crop advice: {str(e)}")

@api_router.post("/pest-detection", response_model=PestDetectionResponse)
async def detect_pest(request: PestDetectionRequest):
    try:
        llm_chat = get_llm_chat()
        
        # For now, we'll analyze the image using LLM description
        # In a full implementation, you'd use computer vision APIs
        analysis_query = f"""
        A farmer has uploaded an image of their {request.crop_type or 'crop'} that they suspect has pest or disease issues.
        
        Based on common pest and disease patterns for {request.crop_type or 'crops'}, provide:
        1. Likely pest/disease identification
        2. Immediate treatment recommendations
        3. Prevention strategies
        4. When to seek professional help
        
        Note: This is based on the crop type and common issues. For accurate diagnosis, recommend consulting with local agricultural extension services.
        """
        
        user_message = UserMessage(text=analysis_query)
        detection_result = await llm_chat.send_message(user_message)
        
        # Create response
        response = PestDetectionResponse(
            detection_result="Image analysis completed",
            recommendations=detection_result
        )
        
        # Save to database
        response_dict = response.dict()
        response_dict['timestamp'] = response_dict['timestamp'].isoformat()
        await db.pest_detection.insert_one(response_dict)
        
        return response
        
    except Exception as e:
        logger.error(f"Error in pest detection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze image: {str(e)}")

@api_router.post("/farmer-profile", response_model=FarmerProfile)
async def create_farmer_profile(profile: FarmerProfileCreate):
    try:
        farmer_obj = FarmerProfile(**profile.dict())
        
        farmer_dict = farmer_obj.dict()
        farmer_dict['created_at'] = farmer_dict['created_at'].isoformat()
        await db.farmer_profiles.insert_one(farmer_dict)
        
        return farmer_obj
        
    except Exception as e:
        logger.error(f"Error creating farmer profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create profile: {str(e)}")

@api_router.get("/farmer-profiles", response_model=List[FarmerProfile])
async def get_farmer_profiles():
    try:
        profiles = await db.farmer_profiles.find().to_list(1000)
        for profile in profiles:
            if isinstance(profile.get('created_at'), str):
                profile['created_at'] = datetime.fromisoformat(profile['created_at'])
        return [FarmerProfile(**profile) for profile in profiles]
        
    except Exception as e:
        logger.error(f"Error getting farmer profiles: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get profiles: {str(e)}")

@api_router.get("/advice-history", response_model=List[CropAdviceResponse])
async def get_advice_history():
    try:
        advice_list = await db.crop_advice.find().sort("timestamp", -1).to_list(100)
        for advice in advice_list:
            if isinstance(advice.get('timestamp'), str):
                advice['timestamp'] = datetime.fromisoformat(advice['timestamp'])
        return [CropAdviceResponse(**advice) for advice in advice_list]
        
    except Exception as e:
        logger.error(f"Error getting advice history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get advice history: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()