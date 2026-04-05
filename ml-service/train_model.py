"""
Train Random Forest model on UCI Heart Disease Dataset
Saves trained model as heart_model.pkl
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import StandardScaler
import joblib
import os

def train_model():
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(script_dir, 'heart.csv')
    
    # Load dataset
    print("=" * 50)
    print("  Heart Disease Prediction - Model Training")
    print("=" * 50)
    
    df = pd.read_csv(data_path)
    print(f"\nDataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")
    print(f"Features: {list(df.columns)}")
    
    # Display class distribution
    print(f"\nTarget Distribution:")
    print(f"  No Disease (0): {(df['target'] == 0).sum()}")
    print(f"  Disease (1):    {(df['target'] == 1).sum()}")
    
    # Separate features and target
    X = df.drop('target', axis=1)
    y = df['target']
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"\nTraining set: {X_train.shape[0]} samples")
    print(f"Test set:     {X_test.shape[0]} samples")
    
    # Train Random Forest
    print("\nTraining Random Forest Classifier...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\n{'=' * 50}")
    print(f"  Model Accuracy: {accuracy * 100:.2f}%")
    print(f"{'=' * 50}")
    print(f"\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['No Disease', 'Disease']))
    
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # Feature Importance
    feature_names = X.columns.tolist()
    importances = model.feature_importances_
    feature_importance = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
    
    print(f"\nFeature Importance (Top to Bottom):")
    for fname, imp in feature_importance:
        bar = "█" * int(imp * 50)
        print(f"  {fname:>10}: {imp:.4f} {bar}")
    
    # Save model, scaler, and metadata
    model_path = os.path.join(script_dir, 'heart_model.pkl')
    scaler_path = os.path.join(script_dir, 'scaler.pkl')
    
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    
    # Save feature importance for the frontend
    importance_dict = {name: float(imp) for name, imp in feature_importance}
    joblib.dump(importance_dict, os.path.join(script_dir, 'feature_importance.pkl'))
    
    print(f"\n✅ Model saved to: {model_path}")
    print(f"✅ Scaler saved to: {scaler_path}")
    print(f"✅ Feature importance saved")
    print(f"\nModel accuracy: {accuracy * 100:.2f}%")
    
    return accuracy

if __name__ == '__main__':
    train_model()
