# Smart Crop Advisor 🌾

An AI-powered web platform designed to provide intelligent crop recommendations to Indian farmers based on soil health data, environmental factors, and regional specifics. This project aims to empower farmers by analyzing their Soil Health Cards and providing localized, language-accessible agricultural insights backed by a multi-agent AI system.

## 🚀 Fully Implemented Features

* **Intelligent Crop Recommendation (End-to-End)**: A React frontend seamlessly connects to a Python FastAPI backend. User-provided soil parameters (Nitrogen, Phosphorus, Potassium, pH) and weather data (Temperature, Humidity, Rainfall) are sent to a trained Machine Learning model to generate real-time, accurate crop predictions.
* **Real-time Weather & Location Detection**: Integrates the OpenWeatherMap API and browser Geolocation. With a single click, it accurately detects the user's city via Reverse Geocoding and fetches live temperature and humidity data for their farm.
* **Multi-Agent AI Decision System**: Features a sophisticated AI agent architecture powered by Ollama. Different specialized AI agents evaluate the ML recommendations and can interact directly with the user via a dedicated AI Agent Chat interface, explaining why certain crops are suitable or rejected.
* **Multilingual Accessibility (Google Translate Integration)**: A flawlessly integrated Google Translate widget that instantly translates the entire web portal into 9 major languages (English, Hindi, Marathi, Tamil, Telugu, Kannada, Gujarati, Bengali, Punjabi), making the application truly accessible to rural farmers.
* **Interactive Data Collection**: A highly responsive, dynamic UI form designed to capture essential environmental variables robustly to feed the ML and AI backends.

## 🛠️ Technology Stack

* **Frontend Core**: React 19, Vite, React Router v7
* **Styling & UI**: Tailwind CSS v4 (Modern, clean, utility-first green-themed aesthetic)
* **Backend API**: Python (`backend/main.py`) serving the application logic via FastAPI.
* **Machine Learning**: Predictive models located in the `master_ML/` ecosystem (`scikit-learn`, `xgboost`).
* **AI Engine**: Ollama (for running the multi-agent AI pipelines).
* **APIs**: OpenWeatherMap (Geocoding & Live Weather Data).
* **PDF Tooling**: `pdfkit` (used for generating standardized sample soil health cards).

## 📂 Project Structure

```text
├── AIagent/            # Logic and data loaders for the Multi-Agent Ollama system
├── backend/            # Python FastAPI backend server serving ML predictions & AI Chat
├── master_ML/          # Machine learning models and Python requirements
├── public/             # Static assets and generated sample Soil Health Card PDFs
├── scripts/            # Development scripts (e.g., generate-cards.js)
├── src/
│   ├── components/     # Reusable UI elements (Navbar, InputForm, MLResults, etc.)
│   ├── context/        # React Context providers (LanguageContext)
│   ├── data/           # Mock data generators for the UI
│   ├── pages/          # Main views (Home, AIAgentChat, MLAgentResults)
│   ├── utils/          # Utilities (weatherService.js for OpenWeather API)
│   ├── App.jsx         # Main React Router setup
│   └── index.css       # Global styles and Google Translate overrides
└── README.md           # Project documentation
```

## 💻 Getting Started

### 1. Frontend Setup
Make sure you have [Node.js](https://nodejs.org/) installed.
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

### 2. Backend Setup
Make sure you have Python installed and [Ollama](https://ollama.com/) running locally.
```bash
# Install ML requirements
pip install -r master_ML/requirements.txt

# Install AI requirements
pip install ollama fastapi uvicorn

# Run the backend server
cd backend
python main.py
```

## 📄 Testing with Sample Data

To test the OCR and PDF upload capabilities, three realistic, official-looking Soil Health Card PDFs have been generated in the `public/` directory:
1. `Balanced_Soil_Health_Card.pdf`
2. `Low_Fertility_Soil_Health_Card.pdf`
3. `High_Fertility_Soil_Health_Card.pdf`

You can select **"Upload Soil Health Card (PDF)"** on the main dashboard and provide any of these files to observe the different ML outputs.

---
*Built for Bharat - Empowering Indian Agriculture with AI*
