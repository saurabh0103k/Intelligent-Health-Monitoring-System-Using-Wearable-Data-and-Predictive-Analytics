const express = require('express');
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/history/:userId
 * Get all prediction history for a user (for trend graphs)
 */
router.get('/:userId', verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        // Get all predictions with input data
        const [history] = await pool.execute(
            `SELECT 
                ph.history_id,
                ph.risk_percentage,
                ph.risk_level,
                ph.prediction_date,
                ph.age,
                ph.trestbps,
                ph.chol,
                ph.thalach,
                p.prediction_result,
                p.model_used,
                p.predicted_at
             FROM prediction_history ph
             JOIN predictions p ON ph.prediction_id = p.prediction_id
             WHERE ph.user_id = ?
             ORDER BY ph.prediction_date ASC`,
            [userId]
        );

        // Calculate stats
        const totalPredictions = history.length;
        let avgRisk = 0;
        let highRiskCount = 0;

        if (totalPredictions > 0) {
            avgRisk = history.reduce((sum, h) => sum + h.risk_percentage, 0) / totalPredictions;
            highRiskCount = history.filter(h => h.risk_level === 'High' || h.risk_level === 'Critical').length;
        }

        res.json({
            history,
            stats: {
                totalPredictions,
                averageRisk: Math.round(avgRisk * 100) / 100,
                highRiskCount,
                latestRisk: totalPredictions > 0 ? history[history.length - 1].risk_percentage : null,
                latestRiskLevel: totalPredictions > 0 ? history[history.length - 1].risk_level : null
            }
        });

    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ error: 'Server error fetching history.' });
    }
});

/**
 * GET /api/history/recommendations/:riskLevel
 * Get health recommendations by risk level
 */
router.get('/recommendations/:riskLevel', verifyToken, async (req, res) => {
    try {
        const riskLevel = req.params.riskLevel;

        const [recommendations] = await pool.execute(
            'SELECT * FROM health_recommendations WHERE risk_level = ?',
            [riskLevel]
        );

        if (recommendations.length === 0) {
            return res.status(404).json({ error: 'No recommendations found for this risk level.' });
        }

        res.json({ recommendation: recommendations[0] });

    } catch (error) {
        console.error('Recommendations error:', error);
        res.status(500).json({ error: 'Server error fetching recommendations.' });
    }
});

/**
 * GET /api/history/details/:predictionId
 * Get detailed prediction by ID
 */
router.get('/details/:predictionId', verifyToken, async (req, res) => {
    try {
        const predictionId = req.params.predictionId;

        const [predictions] = await pool.execute(
            `SELECT p.*, h.age as input_age, h.sex, h.cp, h.trestbps, h.chol, h.fbs, 
                    h.restecg, h.thalach, h.exang, h.oldpeak, h.slope, h.ca, h.thal
             FROM predictions p
             JOIN heart_disease_inputs h ON p.input_id = h.input_id
             WHERE p.prediction_id = ?`,
            [predictionId]
        );

        if (predictions.length === 0) {
            return res.status(404).json({ error: 'Prediction not found.' });
        }

        const [recommendations] = await pool.execute(
            'SELECT * FROM health_recommendations WHERE risk_level = ?',
            [predictions[0].risk_level]
        );

        res.json({
            prediction: predictions[0],
            recommendation: recommendations.length > 0 ? recommendations[0] : null
        });

    } catch (error) {
        console.error('Prediction detail error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
