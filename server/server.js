const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');
const { setupDatabase } = require('./setup-db');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
];

function isLocalDevOrigin(origin) {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toLocaleTimeString()} | ${req.method} ${req.path}`);
    next();
});

// Routes
const authRoutes = require('./routes/auth');
const predictionRoutes = require('./routes/prediction');
const historyRoutes = require('./routes/history');

app.use('/api/auth', authRoutes);
app.use('/api/predict', predictionRoutes);
app.use('/api/history', historyRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'Health Monitoring System API',
        timestamp: new Date().toISOString()
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
    console.log('='.repeat(50));
    console.log('  Intelligent Health Monitoring System - Server');
    console.log('='.repeat(50));

    try {
        // Setup database tables
        await setupDatabase();

        // Test database connection
        const connected = await testConnection();
        if (!connected) {
            console.error('❌ Cannot start server without database connection.');
            process.exit(1);
        }

        app.listen(PORT, () => {
            console.log(`\n🚀 Server running on http://localhost:${PORT}`);
            console.log(`   API Health: http://localhost:${PORT}/api/health`);
            console.log(`   Auth:       http://localhost:${PORT}/api/auth`);
            console.log(`   Predict:    http://localhost:${PORT}/api/predict`);
            console.log(`   History:    http://localhost:${PORT}/api/history\n`);
        });
    } catch (error) {
        console.error('❌ Server startup failed:', error.message);
        process.exit(1);
    }
}

startServer();
