const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');

const { protect } = require('../middleware/auth');

// ============================================
// Manager Routes
// ============================================

// Create new quotation
router.post('/', protect, quotationController.createQuotation);

// Get all quotations (manager view)
router.get('/', quotationController.getAllQuotations);

// Get quotation stats
router.get('/stats', quotationController.getQuotationStats);

// Update quotation
router.put('/:id', quotationController.updateQuotation);

// Approve quotation (manager)
router.patch('/:id/approve', quotationController.approveByManager);

// Send quotation to client app
router.patch('/:id/send', quotationController.sendToClient);



// ============================================
// client app Routes
// ============================================

// Get quotations for a specific client
router.get('/client/:clientId', quotationController.getClientQuotations);

// Get single quotation for client (with visibility check)
router.get('/client/:clientId/:id', quotationController.getClientQuotation);

// Accept quotation (client app)
router.patch('/:id/accept', quotationController.acceptByClient);

// Reject quotation (client app)
router.patch('/:id/reject', quotationController.rejectByClient);

// Confirm address and proceed (client app)
router.put('/:id/confirm-address', quotationController.confirmAddress);

// Reject quotation (manager)
router.put('/:id/reject', quotationController.rejectQuotation);

// ============================================
// Common Routes
// ============================================

// Get single quotation by ID
router.get('/:id', quotationController.getQuotation);

// Delete quotation (admin only)
router.delete('/:id', quotationController.deleteQuotation);

module.exports = router;
