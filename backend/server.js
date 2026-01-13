const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

const authRoutes = require('./routes/authRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Body:', req.body);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
