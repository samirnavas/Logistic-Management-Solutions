const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

// ============================================
// Avatar Upload Routes
// ============================================

// Upload/Update user avatar (profile picture)
// POST /api/upload/avatar/:userId
router.post('/avatar/:userId', protect, uploadController.uploadAvatar);

// ============================================
// Product Photos Upload Routes
// ============================================

// Upload multiple product photos (for shipment requests)
// POST /api/upload/products
router.post('/products', protect, uploadController.uploadProductPhotos);

// ============================================
// PDF Upload Routes (Managers)
// ============================================

// Upload PDF document
// POST /api/upload/pdf
router.post('/pdf', protect, uploadController.uploadPdf);

// Upload PDF and link to quotation
// POST /api/upload/pdf/:quotationId
router.post('/pdf/:quotationId', protect, uploadController.uploadPdf);

// ============================================
// Delete File Route
// ============================================

// Delete file from Cloudinary
// DELETE /api/upload/file
router.delete('/file', protect, uploadController.deleteFile);

module.exports = router;
