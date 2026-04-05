/**
 * Auto-create database and tables on first run
 */

const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'health_monitoring_system';

async function setupDatabase() {
    console.log('='.repeat(50));
    console.log('  Database Setup - Health Monitoring System');
    console.log('='.repeat(50));

    // Connect without database first to create it
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'saurabh0103',
        port: process.env.DB_PORT || 3306
    });

    try {
        // Create database
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
        await connection.query(`USE \`${DB_NAME}\``);
        console.log(`\n✅ Database '${DB_NAME}' ready`);

        // Table 1: users
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                user_id       INT AUTO_INCREMENT PRIMARY KEY,
                full_name     VARCHAR(100)  NOT NULL,
                email         VARCHAR(150)  NOT NULL UNIQUE,
                password_hash VARCHAR(255)  NOT NULL,
                phone         VARCHAR(15),
                age           INT,
                gender        ENUM('Male', 'Female', 'Other') NOT NULL,
                profile_image VARCHAR(255)  DEFAULT NULL,
                created_at    DATETIME      DEFAULT CURRENT_TIMESTAMP,
                updated_at    DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Table: users');

        // Table 2: heart_disease_inputs
        await connection.query(`
            CREATE TABLE IF NOT EXISTS heart_disease_inputs (
                input_id   INT AUTO_INCREMENT PRIMARY KEY,
                user_id    INT NOT NULL,
                age        INT          NOT NULL,
                sex        TINYINT      NOT NULL,
                cp         TINYINT      NOT NULL,
                trestbps   INT          NOT NULL,
                chol       INT          NOT NULL,
                fbs        TINYINT      NOT NULL,
                restecg    TINYINT      NOT NULL,
                thalach    INT          NOT NULL,
                exang      TINYINT      NOT NULL,
                oldpeak    FLOAT        NOT NULL,
                slope      TINYINT      NOT NULL,
                ca         TINYINT      NOT NULL,
                thal       TINYINT      NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                INDEX idx_user_inputs (user_id),
                INDEX idx_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Table: heart_disease_inputs');

        // Table 3: predictions
        await connection.query(`
            CREATE TABLE IF NOT EXISTS predictions (
                prediction_id     INT AUTO_INCREMENT PRIMARY KEY,
                user_id           INT NOT NULL,
                input_id          INT NOT NULL,
                risk_percentage   FLOAT        NOT NULL,
                prediction_result TINYINT      NOT NULL,
                risk_level        ENUM('Low', 'Moderate', 'High', 'Critical') NOT NULL,
                model_used        VARCHAR(100) DEFAULT 'Random Forest',
                model_accuracy    FLOAT        DEFAULT NULL,
                recommendation    TEXT,
                predicted_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (input_id) REFERENCES heart_disease_inputs(input_id) ON DELETE CASCADE,
                INDEX idx_user_predictions (user_id),
                INDEX idx_risk_level (risk_level),
                INDEX idx_predicted_at (predicted_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Table: predictions');

        // Table 4: prediction_history
        await connection.query(`
            CREATE TABLE IF NOT EXISTS prediction_history (
                history_id       INT AUTO_INCREMENT PRIMARY KEY,
                user_id          INT NOT NULL,
                prediction_id    INT NOT NULL,
                risk_percentage  FLOAT NOT NULL,
                risk_level       ENUM('Low', 'Moderate', 'High', 'Critical') NOT NULL,
                prediction_date  DATE NOT NULL,
                age              INT,
                trestbps         INT,
                chol             INT,
                thalach          INT,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (prediction_id) REFERENCES predictions(prediction_id) ON DELETE CASCADE,
                INDEX idx_user_history (user_id),
                INDEX idx_date (prediction_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Table: prediction_history');

        // Table 5: health_recommendations
        await connection.query(`
            CREATE TABLE IF NOT EXISTS health_recommendations (
                rec_id              INT AUTO_INCREMENT PRIMARY KEY,
                risk_level          ENUM('Low', 'Moderate', 'High', 'Critical') NOT NULL,
                recommendation_text TEXT NOT NULL,
                lifestyle_tips      TEXT,
                diet_suggestions    TEXT,
                exercise_advice     TEXT,
                UNIQUE INDEX idx_risk_level (risk_level)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Table: health_recommendations');

        // Insert default recommendations (ignore if already exist)
        const [existing] = await connection.query('SELECT COUNT(*) as count FROM health_recommendations');
        if (existing[0].count === 0) {
            await connection.query(`
                INSERT INTO health_recommendations (risk_level, recommendation_text, lifestyle_tips, diet_suggestions, exercise_advice) VALUES
                ('Low', 'Your heart health looks good! Keep maintaining a healthy lifestyle.', 'Continue regular health checkups. Practice stress management through meditation or hobbies.', 'Maintain a balanced diet rich in fruits, vegetables, and whole grains. Limit processed foods.', 'Continue regular exercise: 150 minutes of moderate activity per week.'),
                ('Moderate', 'You have a moderate risk of heart disease. Consider lifestyle modifications and consult a doctor.', 'Reduce stress. Quit smoking if applicable. Monitor blood pressure regularly.', 'Reduce sodium below 2,300 mg/day. Increase omega-3 fatty acids. Limit red meat.', 'Aim for 30 minutes of moderate exercise 5 days/week.'),
                ('High', 'You are at high risk of heart disease. Please consult a cardiologist immediately.', 'Schedule a doctor appointment this week. Monitor BP and sugar daily. Avoid alcohol.', 'Follow a DASH diet. Eliminate fried foods and excess sugar.', 'Start with light walking 15-20 min/day. Avoid heavy exertion.'),
                ('Critical', 'URGENT: Critical risk of heart disease. Seek immediate medical attention!', 'Visit emergency department or cardiologist TODAY.', 'Follow strict medical dietary guidelines. Avoid salt, sugar, and saturated fats.', 'Do NOT exercise without medical clearance. Follow prescribed treatment.')
            `);
            console.log('✅ Default health recommendations inserted');
        }

        console.log('\n🎉 All tables created successfully!');
        console.log(`   Database: ${DB_NAME}`);
        console.log('   Tables: users, heart_disease_inputs, predictions, prediction_history, health_recommendations\n');

    } catch (error) {
        console.error('❌ Setup error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

// Run if called directly
if (require.main === module) {
    setupDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { setupDatabase };
