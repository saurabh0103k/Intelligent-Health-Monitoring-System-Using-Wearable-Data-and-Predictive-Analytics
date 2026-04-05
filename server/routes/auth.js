const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        const { full_name, email, password, phone, age, gender } = req.body;

        // Validation
        if (!full_name || !email || !password || !gender) {
            return res.status(400).json({ error: 'Full name, email, password, and gender are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        // Check if email already exists
        const [existing] = await pool.execute(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'Email already registered. Please login instead.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert user
        const [result] = await pool.execute(
            'INSERT INTO users (full_name, email, password_hash, phone, age, gender) VALUES (?, ?, ?, ?, ?, ?)',
            [full_name, email, password_hash, phone || null, age || null, gender]
        );

        console.log(`✅ New user registered: ${email} (ID: ${result.insertId})`);

        res.status(201).json({
            message: 'Registration successful! Please login.',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

/**
 * POST /api/auth/login
 * Login and get JWT token
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Find user
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const user = users[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Generate JWT token (24 hours)
        const token = jwt.sign(
            {
                userId: user.user_id,
                email: user.email,
                fullName: user.full_name
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log(`✅ User logged in: ${email}`);

        res.json({
            message: 'Login successful!',
            token,
            user: {
                userId: user.user_id,
                fullName: user.full_name,
                email: user.email,
                phone: user.phone,
                age: user.age,
                gender: user.gender,
                createdAt: user.created_at
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

/**
 * GET /api/auth/profile
 * Get logged-in user's profile (protected)
 */
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT user_id, full_name, email, phone, age, gender, profile_image, created_at FROM users WHERE user_id = ?',
            [req.user.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json({ user: users[0] });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Server error fetching profile.' });
    }
});

module.exports = router;
