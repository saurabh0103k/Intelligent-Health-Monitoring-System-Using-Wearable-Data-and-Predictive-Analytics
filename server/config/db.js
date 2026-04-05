require('dotenv').config();
const mysql = require('mysql2/promise');

// MySQL Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'saurabh0103',
    database: process.env.DB_NAME || 'health_monitoring_system',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL Database connected successfully!');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL Connection failed:', error.message);
        return false;
    }
}

module.exports = { pool, testConnection };
