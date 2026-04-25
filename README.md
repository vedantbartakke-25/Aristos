# Smart Crop Advisor 🌾

An AI-powered web platform designed to provide intelligent crop recommendations to Indian farmers based on soil health data, environmental factors, and regional specifics. This project aims to empower farmers by analyzing their Soil Health Cards and providing localized, language-accessible agricultural insights.

## 🚀 Fully Implemented Features
* **Intelligent Crop Recommendation (End-to-End)**: A React frontend seamlessly connects to a Python FastAPI backend. User-provided soil parameters (Nitrogen, Phosphorus, Potassium, pH) and weather data (Temperature, Humidity, Rainfall) are sent to a trained Machine Learning model to generate real-time, accurate crop predictions.
* **Multilingual Accessibility (Google Translate Integration)**: A flawlessly integrated Google Translate widget that instantly translates the entire web portal into 9 major languages (English, Hindi, Marathi, Tamil, Telugu, Kannada, Gujarati, Bengali, Punjabi), making the application truly accessible to rural farmers.
* **Interactive Data Collection**: A highly responsive, dynamic UI form designed to capture essential environmental variables robustly to feed the ML backend.

## 🛠️ Technology Stack
* **Frontend Core**: React 19, Vite, React Router v7
* **Styling & UI**: Tailwind CSS v4 (Modern, clean, utility-first green-themed aesthetic)
* **Backend API**: Python (`backend/main.py`) serving the application logic.
* **Machine Learning**: Predictive models located in the `master_ML/` ecosystem.
* **PDF Tooling**: `pdfkit` (used for generating standardized sample soil health cards).

## 📂 Project Structure
```text
├── backend/            # Python backend server serving ML predictions
├── master_ML/          # Machine learning models and Python requirements
├── public/             # Static assets and generated sample Soil Health Card PDFs
├── scripts/            # Development scripts (e.g., generate-cards.js)
├── src/
│   ├── components/     # Reusable UI elements (Navbar, InputForm, MLResults, etc.)
│   ├── context/        # React Context providers (LanguageContext)
│   ├── data/           # Mock data generators for the UI
│   ├── pages/          # Main application views (Login, Register, Home)
│   ├── App.jsx         # Main React Router setup
│   ├── main.jsx        # Application entry point
│   └── index.css       # Global styles and Google Translate overrides
├── package.json        # Node.js dependencies
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
Access the web portal at `http://localhost:5173`.

### 2. Backend Setup
Make sure you have Python installed.
```bash
# Navigate to the backend or ML directory
cd master_ML

# Install required Python dependencies
pip install -r requirements.txt

# Run the backend server
cd ../backend
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
