const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// Import Routes
// ============================================
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Connect to Database
connectDB();

// ============================================
// Middleware
// ============================================
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for photo uploads

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
        const bodyStr = JSON.stringify(req.body, null, 2);
        if (bodyStr) {
            console.log('Body:', bodyStr.substring(0, 500));
        }
    }
    next();
});

// ============================================
// API Routes
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/notifications', notificationRoutes);

// ============================================
// Health Check & Base Route
// ============================================
app.get('/', (req, res) => {
    res.json({
        message: 'Logistics Management API is running',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            shipments: '/api/shipments',
            quotations: '/api/quotations',
            notifications: '/api/notifications',
        }
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// ============================================
// Error Handling Middleware
// ============================================
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({
        message: 'Internal server error',
        error: err.message,
        stack: err.stack,
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        message: 'Endpoint not found',
        path: req.path,
    });
});

// ============================================
// Start Server
// ============================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║   Logistics Management API Server                ║
╠══════════════════════════════════════════════════╣
║   Status:   Running                              ║
║   Port:     ${PORT}                                 ║
║   Time:     ${new Date().toISOString()}       ║
╚══════════════════════════════════════════════════╝
    `);
    console.log('Available endpoints:');
    console.log('  - POST   /api/auth/register');
    console.log('  - POST   /api/auth/login');
    console.log('  - GET    /api/users/:userId');
    console.log('  - GET    /api/shipments');
    console.log('  - GET    /api/requests');
    console.log('  - GET    /api/quotations');
    console.log('  - GET    /api/notifications/user/:userId');
});
