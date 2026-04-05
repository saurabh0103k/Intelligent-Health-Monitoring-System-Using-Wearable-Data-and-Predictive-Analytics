# 🫀 Intelligent Health Monitoring System

An intelligent health monitoring system that uses data from wearable devices and predictive analytics to continuously track health conditions and detect potential health risks at an early stage.

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Chart.js, React Router |
| Backend | Node.js, Express.js |
| Database | MySQL |
| ML Service | Python, Flask, scikit-learn (Random Forest) |
| Dataset | UCI Heart Disease Dataset |

## 📁 Project Structure

```
├── client/          → React Frontend (Port 3000)
├── server/          → Node.js + Express API (Port 5000)
├── ml-service/      → Python ML Service (Port 5001)
└── README.md
```

## 🚀 How to Run

### Prerequisites
- Node.js (v18+)
- Python (v3.8+)
- MySQL Server running

### Step 1: Train the ML Model
```bash
cd ml-service
pip install -r requirements.txt
python train_model.py
```

### Step 2: Start the Python ML Service
```bash
cd ml-service
python app.py
# Runs on http://localhost:5001
```

### Step 3: Start the Backend Server
```bash
cd server
npm install
npm start
# Runs on http://localhost:5000
# Auto-creates database and tables
```

### Step 4: Start the React Frontend
```bash
cd client
npm install
npm start
# Runs on http://localhost:3000
```

## 📊 Application Flow

1. **Register/Login** → Create account or login with credentials
2. **Dashboard** → View health stats and latest prediction
3. **Heart Disease Prediction** → Enter 13 health parameters using sliders & dropdowns
4. **Prediction Results** → View risk percentage in gauge chart, feature importance, recommendations
5. **History** → Track risk trends over time with interactive graphs

## 🗄️ Database Tables

1. `users` - User registration and authentication
2. `heart_disease_inputs` - 13 UCI features entered by user
3. `predictions` - ML prediction results with risk level
4. `prediction_history` - Historical tracking for trend graphs
5. `health_recommendations` - Pre-defined health advice by risk level

## 📈 Dataset

UCI Heart Disease Dataset with 14 features:
- Age, Sex, Chest Pain Type, Blood Pressure, Cholesterol
- Blood Sugar, ECG, Max Heart Rate, Exercise Angina
- ST Depression, ST Slope, Major Vessels, Thalassemia, Target
