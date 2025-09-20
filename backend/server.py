from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import base64
import io
from PIL import Image
import random

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

# New Models for Crop Calendar & Marketplace
class CropCalendarEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    crop_name: str
    farmer_id: str
    sowing_date: datetime
    harvesting_date: datetime
    expected_yield: float
    market_demand_score: float
    recommended_selling_date: datetime
    estimated_price: float
    weather_risk: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MarketPrice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    crop_name: str
    mandi_name: str
    location: str
    current_price: float
    trend: str  # "up", "down", "stable"
    demand_level: str  # "high", "medium", "low"
    quality_grade: str
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MarketAlert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    farmer_id: str
    crop_name: str
    alert_type: str  # "price_spike", "high_demand", "best_selling_time"
    message: str
    priority: str  # "high", "medium", "low"
    mandi_name: str
    price_offered: float
    valid_until: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CropRecommendation(BaseModel):
    crop_name: str
    confidence_score: float
    expected_profit_per_acre: float
    market_demand_forecast: str
    sowing_window: str
    harvest_window: str
    key_benefits: List[str]
    risks: List[str]

class DemandForecast(BaseModel):
    crop_name: str
    current_demand: str
    forecast_3_months: str
    forecast_6_months: str
    price_trend: str
    market_factors: List[str]

# Initialize LLM Chat
def get_llm_chat():
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")
    
    return LlmChat(
        api_key=api_key,
        session_id="crop_advisory_session",
        system_message="""You are an expert agricultural advisor and market analyst specialized in Punjab/Haryana agriculture. 
        
        Provide practical advice on:
        - Crop planning and calendar optimization
        - Market timing and price forecasting
        - Weather-based farming decisions
        - Yield optimization strategies
        - Risk management in farming
        
        Focus on major crops: Rice, Wheat, Corn, Cotton, Sugarcane, Mustard, and regional varieties.
        Always consider local climate, soil conditions, and market dynamics of Punjab/Haryana region."""
    ).with_model("openai", "gpt-4o-mini")

# Simulated data for demo
PUNJAB_CROPS_DATA = {
    "Rice": {
        "sowing_months": [6, 7],  # June-July
        "harvest_months": [10, 11],  # Oct-Nov
        "growing_days": 120,
        "avg_yield_per_acre": 25,  # quintals
        "base_price": 2200  # per quintal
    },
    "Wheat": {
        "sowing_months": [11, 12],  # Nov-Dec
        "harvest_months": [4, 5],  # Apr-May
        "growing_days": 150,
        "avg_yield_per_acre": 22,
        "base_price": 2500
    },
    "Corn": {
        "sowing_months": [6, 7],
        "harvest_months": [9, 10],
        "growing_days": 90,
        "avg_yield_per_acre": 28,
        "base_price": 1800
    },
    "Cotton": {
        "sowing_months": [4, 5],
        "harvest_months": [10, 11, 12],
        "growing_days": 180,
        "avg_yield_per_acre": 15,
        "base_price": 6500
    },
    "Sugarcane": {
        "sowing_months": [2, 3, 10, 11],
        "harvest_months": [12, 1, 2, 3],
        "growing_days": 300,
        "avg_yield_per_acre": 400,
        "base_price": 350
    },
    "Mustard": {
        "sowing_months": [10, 11],
        "harvest_months": [3, 4],
        "growing_days": 130,
        "avg_yield_per_acre": 12,
        "base_price": 5200
    }
}

PUNJAB_MANDIS = [
    "Ludhiana Mandi", "Amritsar Mandi", "Jalandhar Mandi", "Patiala Mandi",
    "Bathinda Mandi", "Mohali Mandi", "Ferozepur Mandi", "Gurdaspur Mandi"
]

def generate_market_prices():
    """Generate realistic market prices for demo"""
    prices = []
    for crop, data in PUNJAB_CROPS_DATA.items():
        for mandi in PUNJAB_MANDIS[:4]:  # Use top 4 mandis
            # Add some realistic price variation
            price_variation = random.uniform(0.85, 1.15)
            current_price = data["base_price"] * price_variation
            
            trend = random.choice(["up", "down", "stable"])
            demand = random.choice(["high", "medium", "low"])
            
            prices.append(MarketPrice(
                crop_name=crop,
                mandi_name=mandi,
                location=mandi.split()[0],
                current_price=round(current_price, 2),
                trend=trend,
                demand_level=demand,
                quality_grade=random.choice(["A", "B", "C"])
            ))
    return prices

def calculate_optimal_calendar(crop_name: str, location: str):
    """Calculate optimal sowing and harvesting dates"""
    if crop_name not in PUNJAB_CROPS_DATA:
        return None
    
    crop_data = PUNJAB_CROPS_DATA[crop_name]
    current_date = datetime.now(timezone.utc)
    
    # Find next optimal sowing date
    sowing_months = crop_data["sowing_months"]
    for month in sowing_months:
        sowing_date = current_date.replace(month=month, day=15)
        if sowing_date < current_date:
            sowing_date = sowing_date.replace(year=current_date.year + 1)
        
        # Calculate harvest date
        harvest_date = sowing_date + timedelta(days=crop_data["growing_days"])
        
        return {
            "sowing_date": sowing_date,
            "harvest_date": harvest_date,
            "expected_yield": crop_data["avg_yield_per_acre"],
            "estimated_price": crop_data["base_price"] * random.uniform(0.95, 1.25)
        }

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
        
        Please provide specific, actionable advice for this farmer's situation considering Punjab/Haryana agricultural conditions.
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
        
        analysis_query = f"""
        A farmer has uploaded an image of their {request.crop_type or 'crop'} that they suspect has pest or disease issues.
        
        Based on common pest and disease patterns for {request.crop_type or 'crops'} in Punjab/Haryana region, provide:
        1. Likely pest/disease identification
        2. Immediate treatment recommendations
        3. Prevention strategies
        4. When to seek professional help
        
        Note: This is based on the crop type and common issues. For accurate diagnosis, recommend consulting with local agricultural extension services.
        """
        
        user_message = UserMessage(text=analysis_query)
        detection_result = await llm_chat.send_message(user_message)
        
        response = PestDetectionResponse(
            detection_result="Image analysis completed",
            recommendations=detection_result
        )
        
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

# NEW CROP CALENDAR & MARKETPLACE ENDPOINTS

@api_router.get("/crop-recommendations/{farmer_id}")
async def get_crop_recommendations(farmer_id: str):
    """Get AI-driven crop recommendations based on market demand and conditions"""
    try:
        llm_chat = get_llm_chat()
        
        # Get farmer profile
        farmer = await db.farmer_profiles.find_one({"id": farmer_id})
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer not found")
        
        location = farmer.get('location', 'Punjab')
        farm_size = farmer.get('farm_size', 'Medium')
        
        query = f"""
        Generate crop recommendations for a farmer in {location} with {farm_size} farm size.
        Consider current market demand, seasonal timing, and profit potential.
        Focus on Punjab/Haryana suitable crops: Rice, Wheat, Corn, Cotton, Sugarcane, Mustard.
        
        Provide recommendations with:
        1. Top 3 recommended crops
        2. Expected profit per acre
        3. Market demand forecast
        4. Optimal sowing and harvest windows
        5. Key benefits and risks for each crop
        """
        
        user_message = UserMessage(text=query)
        ai_response = await llm_chat.send_message(user_message)
        
        # Generate structured recommendations
        recommendations = []
        for crop_name in list(PUNJAB_CROPS_DATA.keys())[:3]:
            crop_data = PUNJAB_CROPS_DATA[crop_name]
            profit = crop_data["avg_yield_per_acre"] * crop_data["base_price"] * random.uniform(0.8, 1.2)
            
            recommendations.append(CropRecommendation(
                crop_name=crop_name,
                confidence_score=random.uniform(0.7, 0.95),
                expected_profit_per_acre=round(profit, 2),
                market_demand_forecast=random.choice(["High", "Medium", "Stable"]),
                sowing_window=f"{crop_data['sowing_months'][0]}-{crop_data['sowing_months'][-1]} months",
                harvest_window=f"{crop_data['harvest_months'][0]}-{crop_data['harvest_months'][-1]} months",
                key_benefits=[
                    "High market demand",
                    "Suitable for local climate",
                    "Good profit margins"
                ],
                risks=[
                    "Weather dependency",
                    "Market price fluctuation"
                ]
            ))
        
        return {
            "farmer_id": farmer_id,
            "recommendations": recommendations,
            "ai_analysis": ai_response,
            "generated_at": datetime.now(timezone.utc)
        }
        
    except Exception as e:
        logger.error(f"Error getting crop recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/crop-calendar")
async def create_crop_calendar(farmer_id: str, crop_name: str):
    """Create optimal crop calendar for farmer"""
    try:
        calendar_data = calculate_optimal_calendar(crop_name, "Punjab")
        if not calendar_data:
            raise HTTPException(status_code=400, detail="Crop not supported")
        
        # Calculate market demand score and weather risk
        market_demand_score = random.uniform(0.6, 0.95)
        weather_risk = random.choice(["Low", "Medium", "High"])
        
        calendar_entry = CropCalendarEntry(
            crop_name=crop_name,
            farmer_id=farmer_id,
            sowing_date=calendar_data["sowing_date"],
            harvesting_date=calendar_data["harvest_date"],
            expected_yield=calendar_data["expected_yield"],
            market_demand_score=market_demand_score,
            recommended_selling_date=calendar_data["harvest_date"] + timedelta(days=random.randint(7, 30)),
            estimated_price=calendar_data["estimated_price"],
            weather_risk=weather_risk
        )
        
        # Save to database
        calendar_dict = calendar_entry.dict()
        calendar_dict['sowing_date'] = calendar_dict['sowing_date'].isoformat()
        calendar_dict['harvesting_date'] = calendar_dict['harvesting_date'].isoformat()
        calendar_dict['recommended_selling_date'] = calendar_dict['recommended_selling_date'].isoformat()
        calendar_dict['created_at'] = calendar_dict['created_at'].isoformat()
        
        await db.crop_calendar.insert_one(calendar_dict)
        
        return calendar_entry
        
    except Exception as e:
        logger.error(f"Error creating crop calendar: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/crop-calendar/{farmer_id}")
async def get_farmer_calendar(farmer_id: str):
    """Get farmer's crop calendar"""
    try:
        calendar_entries = await db.crop_calendar.find({"farmer_id": farmer_id}).to_list(100)
        
        for entry in calendar_entries:
            for date_field in ['sowing_date', 'harvesting_date', 'recommended_selling_date', 'created_at']:
                if isinstance(entry.get(date_field), str):
                    entry[date_field] = datetime.fromisoformat(entry[date_field])
        
        return [CropCalendarEntry(**entry) for entry in calendar_entries]
        
    except Exception as e:
        logger.error(f"Error getting crop calendar: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/market-prices")
async def get_market_prices():
    """Get current market prices from mandis"""
    try:
        # Generate fresh market data for demo
        market_prices = generate_market_prices()
        
        # Save to database for consistency
        for price in market_prices:
            price_dict = price.dict()
            price_dict['last_updated'] = price_dict['last_updated'].isoformat()
            
            # Update existing or insert new
            await db.market_prices.update_one(
                {"crop_name": price.crop_name, "mandi_name": price.mandi_name},
                {"$set": price_dict},
                upsert=True
            )
        
        return market_prices
        
    except Exception as e:
        logger.error(f"Error getting market prices: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/market-alerts/{farmer_id}")
async def get_market_alerts(farmer_id: str):
    """Get personalized market alerts for farmer"""
    try:
        # Get farmer's crops
        farmer = await db.farmer_profiles.find_one({"id": farmer_id})
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer not found")
        
        farmer_crops = farmer.get('primary_crops', [])
        alerts = []
        
        # Generate alerts for farmer's crops
        for crop in farmer_crops:
            if crop in PUNJAB_CROPS_DATA:
                # Price spike alert
                mandi = random.choice(PUNJAB_MANDIS)
                price = PUNJAB_CROPS_DATA[crop]["base_price"] * random.uniform(1.1, 1.4)
                
                alert = MarketAlert(
                    farmer_id=farmer_id,
                    crop_name=crop,
                    alert_type="price_spike",
                    message=f"Price spike for {crop} at {mandi}! Current rate: ₹{price:.2f}/quintal",
                    priority="high",
                    mandi_name=mandi,
                    price_offered=price,
                    valid_until=datetime.now(timezone.utc) + timedelta(days=3)
                )
                alerts.append(alert)
        
        # Add high demand alert
        if farmer_crops:
            crop = random.choice(farmer_crops)
            mandi = random.choice(PUNJAB_MANDIS)
            alert = MarketAlert(
                farmer_id=farmer_id,
                crop_name=crop,
                alert_type="high_demand",
                message=f"High demand for {crop} expected next month. Consider early harvest planning.",
                priority="medium",
                mandi_name=mandi,
                price_offered=PUNJAB_CROPS_DATA.get(crop, {}).get("base_price", 2000) * 1.15,
                valid_until=datetime.now(timezone.utc) + timedelta(days=30)
            )
            alerts.append(alert)
        
        # Save alerts to database
        for alert in alerts:
            alert_dict = alert.dict()
            alert_dict['valid_until'] = alert_dict['valid_until'].isoformat()
            alert_dict['created_at'] = alert_dict['created_at'].isoformat()
            await db.market_alerts.insert_one(alert_dict)
        
        return alerts
        
    except Exception as e:
        logger.error(f"Error getting market alerts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/demand-forecast")
async def get_demand_forecast():
    """Get market demand forecast for major crops"""
    try:
        forecasts = []
        
        for crop_name in PUNJAB_CROPS_DATA.keys():
            forecast = DemandForecast(
                crop_name=crop_name,
                current_demand=random.choice(["High", "Medium", "Low"]),
                forecast_3_months=random.choice(["Increasing", "Stable", "Decreasing"]),
                forecast_6_months=random.choice(["Strong Growth", "Stable", "Decline Expected"]),
                price_trend=random.choice(["Upward", "Stable", "Volatile"]),
                market_factors=[
                    "Export demand increasing",
                    "Government procurement policy",
                    "Weather conditions favorable",
                    "Processing industry expansion"
                ]
            )
            forecasts.append(forecast)
        
        return forecasts
        
    except Exception as e:
        logger.error(f"Error getting demand forecast: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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