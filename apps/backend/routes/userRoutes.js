const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// ============================================
// Profile Routes
// ============================================

// Get user profile
router.get('/:userId', userController.getProfile);

// Update user profile
router.put('/:userId', userController.updateProfile);

// Update avatar
router.patch('/:userId/avatar', userController.updateAvatar);

// Get dashboard stats
router.get('/:userId/dashboard-stats', userController.getDashboardStats);

// ============================================
// Address Management Routes
// ============================================

// Get all saved addresses
router.get('/:userId/addresses', userController.getAddresses);

// Add a new address
router.post('/:userId/addresses', userController.addAddress);

// Update an address
router.put('/:userId/addresses/:addressId', userController.updateAddress);

// Delete an address
router.delete('/:userId/addresses/:addressId', userController.deleteAddress);

// Set an address as default
router.patch('/:userId/addresses/:addressId/default', userController.setDefaultAddress);

// ============================================
// Admin Routes
// ============================================

// Get all users (admin only)
router.get('/', userController.getAllUsers);

// Update user role (admin only)
router.patch('/:userId/role', userController.updateRole);

module.exports = router;
