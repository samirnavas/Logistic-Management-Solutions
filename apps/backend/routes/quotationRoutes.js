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

// Update quotation
router.put('/:id', quotationController.updateQuotation);

// Approve quotation (manager)
router.patch('/:id/approve', quotationController.approveByManager);

// Send quotation to client app
router.patch('/:id/send', quotationController.sendToclient app);



// ============================================
// client app Routes
// ============================================

// Get quotations for a specific client app
router.get('/client app/:client appId', quotationController.getclient appQuotations);

// Get single quotation for client app (with visibility check)
router.get('/client app/:client appId/:id', quotationController.getclient appQuotation);

// Accept quotation (client app)
router.patch('/:id/accept', quotationController.acceptByclient app);

// Reject quotation (client app)
router.patch('/:id/reject', quotationController.rejectByclient app);

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
