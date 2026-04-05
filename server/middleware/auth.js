const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'health_monitoring_secret_key_2026';

/**
 * Middleware to verify JWT token
 * Extracts user info and attaches to req.user
 */
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please login again.' });
        }
        return res.status(403).json({ error: 'Invalid token.' });
    }
}

module.exports = { verifyToken, JWT_SECRET };
