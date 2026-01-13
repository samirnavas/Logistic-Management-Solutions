const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Get user by ID
router.get('/user/:id', authController.getUser);

// Get first user (for testing)
router.get('/first-user', authController.getFirstUser);

// Change password
router.patch('/change-password/:userId', authController.changePassword);

// Verify email
router.patch('/verify-email/:userId', authController.verifyEmail);

module.exports = router;
