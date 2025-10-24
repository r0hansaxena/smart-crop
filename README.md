

# Smart Crop Management System

**An AI-powered agricultural advisory platform for farmers, combining crop advice, pest detection, farmer profile management, and history tracking in a mobile-responsive web interface. Built with React, FastAPI, and MongoDB.**

***

## 🚀 Overview

Smart Crop Management System is designed for modern agriculture. It empowers farmers by providing:

- **AI-driven crop recommendations** tailored to location, crop type, and language.
- **Instant pest and disease detection** via image analysis.
- **Personalized farmer profiles** for ongoing support.
- **Advice history tracking** for continuous learning and smarter decisions.

Originally developed as a hackathon project, the platform puts smart, actionable insights within every farmer’s reach.

***

## 📦 Project Structure

```
smart-crop/
│
├── backend/           # FastAPI backend for APIs, AI, database, integrations
│   ├── server.py
│   ├── requirements.txt
│   └── ...
│
├── frontend/          # React + Tailwind CSS frontend for the web app
│   ├── src/
│   │   ├── App.js
│   │   └── ...
│   ├── public/
│   ├── package.json
│   └── ...
│
├── tests/             # Test scripts for backend and frontend
│   └── __init__.py
│
├── .emergent/         # Configuration for AI/LLM agent and integrations
│   └── emergent.yml
├── .gitignore
├── README.md
└── test_result.md
```

***

## 🛠 Tech Stack

- **Frontend:** React 19, Tailwind CSS, Radix UI, Axios
- **Backend:** FastAPI, Pydantic, Motor (async MongoDB), dotenv
- **AI/LLM:** emergentintegrations, OpenAI GPT-4o mini
- **Database:** MongoDB (async)
- **Other:** PIL (image processing), CORS, Docker-ready structure

***

## ⚙️ Features

- **AI Crop Advisor:** Natural language Q&A powered by GPT-4o mini, returns localized, crop-specific advice.
- **Pest Detection:** Upload crop images for instant AI-driven pest/disease diagnosis & recommendations.
- **Farmer Profile:** Store and manage info—name, location, farm size, primary crops, phone.
- **Advice History:** See all past questions and answers for reference.
- **Mobile-First Responsive UI:** Clean, intuitive interface for phones and desktops.

***

## 🚦 Getting Started

### Prerequisites

- Node.js, Yarn or NPM for frontend
- Python 3.9+ for backend
- MongoDB database (local/cloud)
- OpenAI and Emergent API Keys for AI features

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Set up environment variables in .env (see below)
uvicorn server:app --reload
```

**Environment variables (`.env`):**

```
MONGO_URL=mongodb+srv://<user>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority
DB_NAME=smartcrop
EMERGENT_LLM_KEY=your_emergent_api_key
CORS_ORIGINS=http://localhost:3000
```

### Frontend

```bash
cd frontend
yarn install
yarn start
```

Configure `REACT_APP_BACKEND_URL` in a `.env` file if needed.

***

## 🧩 API Overview

- `POST /api/crop-advice` — Get AI crop advice
- `POST /api/pest-detection` — Analyze crop image for pests
- `POST /api/farmer-profile` — Create new farmer profile
- `GET /api/farmer-profiles` — List all profiles
- `GET /api/advice-history` — Advice history for user

More API details: See [backend/server.py](backend/server.py)

***

## 📱 UI Features (Run `frontend`)

- **Home:** Quick access to core features
- **Profile Form:** Interactive form input and validation
- **AI Chat:** Ask any agri-question, instant replies
- **Pest Detection:** Upload/camera, see results and next steps
- **History:** Timeline of all Q&A, easily browsable

***

## 🧪 Testing

- Automated and manual tests in `/tests` and `test_result.md`
- Run tests and see the current testing state (priority, implemented features, etc.)

***

## 📝 Contributing

Pull requests, issues, and feature requests are welcome!

***

## 📄 License

MIT 

***
