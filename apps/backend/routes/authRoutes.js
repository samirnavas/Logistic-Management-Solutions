const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { check, validationResult } = require('express-validator');

// Register new user
router.post(
    '/register',
    [
        check('fullName', 'Full name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg,
                errors: errors.array()
            });
        }
        next();
    },
    authController.register
);

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
