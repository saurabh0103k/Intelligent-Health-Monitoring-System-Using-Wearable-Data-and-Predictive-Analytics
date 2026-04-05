const express = require('express');
const axios = require('axios');
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

/**
 * POST /api/predict
 * Save health input → call Python ML → save prediction → return result
 */
router.post('/', verifyToken, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const userId = req.user.userId;
        const { age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal } = req.body;

        // Validate all 13 features are present
        const requiredFields = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'];
        const missing = requiredFields.filter(f => req.body[f] === undefined || req.body[f] === null);
        
        if (missing.length > 0) {
            return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
        }

        await connection.beginTransaction();

        // Step 1: Save input data to heart_disease_inputs
        const [inputResult] = await connection.execute(
            `INSERT INTO heart_disease_inputs (user_id, age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal]
        );
        const inputId = inputResult.insertId;

        // Step 2: Call Python ML service
        let mlResponse;
        try {
            mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, {
                age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal
            }, { timeout: 10000 });
        } catch (mlError) {
            await connection.rollback();
            console.error('ML Service error:', mlError.message);
            return res.status(503).json({ 
                error: 'ML prediction service is unavailable. Please ensure the Python service is running on port 5001.' 
            });
        }

        const prediction = mlResponse.data;

        // Step 3: Get recommendation from database
        const [recommendations] = await connection.execute(
            'SELECT * FROM health_recommendations WHERE risk_level = ?',
            [prediction.risk_level]
        );
        const recommendation = recommendations.length > 0 ? recommendations[0] : null;

        // Step 4: Save prediction to predictions table
        const [predResult] = await connection.execute(
            `INSERT INTO predictions (user_id, input_id, risk_percentage, prediction_result, risk_level, model_used, recommendation) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                userId, inputId,
                prediction.risk_percentage,
                prediction.prediction,
                prediction.risk_level,
                prediction.model_used || 'Random Forest',
                recommendation ? recommendation.recommendation_text : ''
            ]
        );
        const predictionId = predResult.insertId;

        // Step 5: Save to prediction_history for trend tracking
        await connection.execute(
            `INSERT INTO prediction_history (user_id, prediction_id, risk_percentage, risk_level, prediction_date, age, trestbps, chol, thalach) 
             VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?, ?)`,
            [userId, predictionId, prediction.risk_percentage, prediction.risk_level, age, trestbps, chol, thalach]
        );

        await connection.commit();

        console.log(`✅ Prediction saved for user ${userId}: ${prediction.risk_percentage}% (${prediction.risk_level})`);

        // Return full result
        res.json({
            success: true,
            prediction: {
                predictionId,
                inputId,
                riskPercentage: prediction.risk_percentage,
                predictionResult: prediction.prediction,
                riskLevel: prediction.risk_level,
                probabilities: prediction.probabilities,
                featureImportance: prediction.feature_importance,
                modelUsed: prediction.model_used
            },
            recommendation: recommendation ? {
                text: recommendation.recommendation_text,
                lifestyle: recommendation.lifestyle_tips,
                diet: recommendation.diet_suggestions,
                exercise: recommendation.exercise_advice
            } : null,
            inputData: { age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Prediction error:', error);
        res.status(500).json({ error: 'Server error during prediction.' });
    } finally {
        connection.release();
    }
});

/**
 * GET /api/predict/latest/:userId
 * Get the latest prediction for a user
 */
router.get('/latest/:userId', verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        const [predictions] = await pool.execute(
            `SELECT p.*, h.* FROM predictions p 
             LEFT JOIN heart_disease_inputs h ON p.input_id = h.input_id 
             WHERE p.user_id = ? 
             ORDER BY p.predicted_at DESC LIMIT 1`,
            [userId]
        );

        if (predictions.length === 0) {
            return res.json({ prediction: null });
        }

        // Get recommendation
        const [recommendations] = await pool.execute(
            'SELECT * FROM health_recommendations WHERE risk_level = ?',
            [predictions[0].risk_level]
        );

        res.json({
            prediction: predictions[0],
            recommendation: recommendations.length > 0 ? recommendations[0] : null
        });

    } catch (error) {
        console.error('Get latest prediction error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
