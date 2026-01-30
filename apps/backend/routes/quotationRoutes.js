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

// Update quotation price (specialized)
router.put('/:id/update-price', quotationController.updateQuotePrice);

// Approve request (manager - initial approval)
router.put('/:id/approve', quotationController.approveRequest);

// Approve quotation (manager - final approval)
router.patch('/:id/approve', quotationController.approveByManager);

// Send quotation to client app
router.patch('/:id/send', quotationController.sendToClient);

// Mark quotation as verified (Operations/Dispatcher - Phase 3)
router.put('/:id/verify', protect, quotationController.markAsVerified);




// ============================================
// client app Routes
// ============================================

// Get quotations for a specific client
router.get('/client/:clientId', quotationController.getClientQuotations);

// Get single quotation for client (with visibility check)
router.get('/client/:clientId/:id', quotationController.getClientQuotation);

// Update address details (client app)
router.put('/:id/address', quotationController.updateAddress);

// Accept quotation (client app)
router.patch('/:id/accept', quotationController.acceptByClient);

// Reject quotation (client app)
router.patch('/:id/reject', quotationController.rejectByClient);

// Request revision / negotiation (client app - Phase 4)
router.post('/:id/request-revision', protect, quotationController.requestRevision);

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

// ============================================
// Clarification Loop
// ============================================

// Request clarification (Manager/Admin)
router.post('/:id/clarification/request', protect, quotationController.requestClarification);

// Submit clarification (client app)
router.post('/:id/clarification/submit', protect, quotationController.submitClarification);

module.exports = router;
