"""
Flask API for Heart Disease Prediction
Serves the trained Random Forest model on port 5001
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# Get script directory
script_dir = os.path.dirname(os.path.abspath(__file__))

# Load model, scaler, and feature importance
model = None
scaler = None
feature_importance = None

def load_models():
    global model, scaler, feature_importance
    model_path = os.path.join(script_dir, 'heart_model.pkl')
    scaler_path = os.path.join(script_dir, 'scaler.pkl')
    importance_path = os.path.join(script_dir, 'feature_importance.pkl')
    
    if not os.path.exists(model_path):
        print("⚠️  Model not found! Please run train_model.py first.")
        print("   Command: python train_model.py")
        return False
    
    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    
    if os.path.exists(importance_path):
        feature_importance = joblib.load(importance_path)
    
    print("✅ Model loaded successfully!")
    return True

# Feature order must match training data
FEATURE_ORDER = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 
                 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal']

def classify_risk(percentage):
    """Classify risk level based on percentage"""
    if percentage <= 25:
        return 'Low'
    elif percentage <= 50:
        return 'Moderate'
    elif percentage <= 75:
        return 'High'
    else:
        return 'Critical'

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'Heart Disease Prediction ML Service',
        'model_loaded': model is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict heart disease risk
    
    Expected JSON body:
    {
        "age": 52, "sex": 1, "cp": 0, "trestbps": 125,
        "chol": 212, "fbs": 0, "restecg": 1, "thalach": 168,
        "exang": 0, "oldpeak": 1.0, "slope": 2, "ca": 2, "thal": 3
    }
    """
    if model is None:
        return jsonify({'error': 'Model not loaded. Run train_model.py first.'}), 500
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Validate all features are present
        missing = [f for f in FEATURE_ORDER if f not in data]
        if missing:
            return jsonify({'error': f'Missing features: {missing}'}), 400
        
        # Extract features in correct order
        features = [float(data[f]) for f in FEATURE_ORDER]
        features_array = np.array(features).reshape(1, -1)
        
        # Scale features
        features_scaled = scaler.transform(features_array)
        
        # Get prediction and probability
        prediction = int(model.predict(features_scaled)[0])
        probabilities = model.predict_proba(features_scaled)[0]
        
        # Risk percentage (probability of disease class)
        risk_percentage = round(float(probabilities[1]) * 100, 2)
        risk_level = classify_risk(risk_percentage)
        
        # Response
        response = {
            'prediction': prediction,
            'risk_percentage': risk_percentage,
            'risk_level': risk_level,
            'probabilities': {
                'no_disease': round(float(probabilities[0]) * 100, 2),
                'disease': round(float(probabilities[1]) * 100, 2)
            },
            'feature_importance': feature_importance if feature_importance else {},
            'model_used': 'Random Forest',
            'input_data': data
        }
        
        return jsonify(response)
    
    except ValueError as e:
        return jsonify({'error': f'Invalid input values: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@app.route('/feature-ranges', methods=['GET'])
def get_feature_ranges():
    """Return valid ranges for each feature (for frontend sliders/dropdowns)"""
    ranges = {
        'age':      {'min': 29, 'max': 77, 'type': 'slider', 'label': 'Age (years)', 'default': 45},
        'sex':      {'options': [{'value': 0, 'label': 'Female'}, {'value': 1, 'label': 'Male'}], 'type': 'dropdown', 'label': 'Sex', 'default': 1},
        'cp':       {'options': [
                        {'value': 0, 'label': 'Typical Angina'},
                        {'value': 1, 'label': 'Atypical Angina'},
                        {'value': 2, 'label': 'Non-anginal Pain'},
                        {'value': 3, 'label': 'Asymptomatic'}
                    ], 'type': 'dropdown', 'label': 'Chest Pain Type', 'default': 0},
        'trestbps': {'min': 94, 'max': 200, 'type': 'slider', 'label': 'Resting Blood Pressure (mm Hg)', 'default': 120},
        'chol':     {'min': 126, 'max': 564, 'type': 'slider', 'label': 'Serum Cholesterol (mg/dl)', 'default': 200},
        'fbs':      {'options': [{'value': 0, 'label': '≤ 120 mg/dl'}, {'value': 1, 'label': '> 120 mg/dl'}], 'type': 'dropdown', 'label': 'Fasting Blood Sugar', 'default': 0},
        'restecg':  {'options': [
                        {'value': 0, 'label': 'Normal'},
                        {'value': 1, 'label': 'ST-T Wave Abnormality'},
                        {'value': 2, 'label': 'Left Ventricular Hypertrophy'}
                    ], 'type': 'dropdown', 'label': 'Resting ECG Results', 'default': 0},
        'thalach':  {'min': 71, 'max': 202, 'type': 'slider', 'label': 'Max Heart Rate (bpm)', 'default': 150},
        'exang':    {'options': [{'value': 0, 'label': 'No'}, {'value': 1, 'label': 'Yes'}], 'type': 'dropdown', 'label': 'Exercise Induced Angina', 'default': 0},
        'oldpeak':  {'min': 0.0, 'max': 6.2, 'step': 0.1, 'type': 'slider', 'label': 'ST Depression (Oldpeak)', 'default': 1.0},
        'slope':    {'options': [
                        {'value': 0, 'label': 'Upsloping'},
                        {'value': 1, 'label': 'Flat'},
                        {'value': 2, 'label': 'Downsloping'}
                    ], 'type': 'dropdown', 'label': 'Slope of Peak Exercise ST', 'default': 0},
        'ca':       {'options': [
                        {'value': 0, 'label': '0'},
                        {'value': 1, 'label': '1'},
                        {'value': 2, 'label': '2'},
                        {'value': 3, 'label': '3'}
                    ], 'type': 'dropdown', 'label': 'Major Vessels (Fluoroscopy)', 'default': 0},
        'thal':     {'options': [
                        {'value': 0, 'label': 'Normal'},
                        {'value': 1, 'label': 'Fixed Defect'},
                        {'value': 2, 'label': 'Reversible Defect'}
                    ], 'type': 'dropdown', 'label': 'Thalassemia', 'default': 0}
    }
    return jsonify(ranges)

if __name__ == '__main__':
    print("=" * 50)
    print("  Heart Disease Prediction - ML Service")
    print("=" * 50)
    
    if load_models():
        print(f"\n🚀 Starting Flask server on port 5001...")
        app.run(host='0.0.0.0', port=5001, debug=True)
    else:
        print("\n❌ Cannot start server without a trained model.")
        print("   Please run: python train_model.py")
