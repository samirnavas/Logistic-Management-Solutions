/**
 * pricingRoutes.js
 *
 * All routes are protected by the `protect` JWT middleware.
 * In production you would also add an `isAdmin` middleware;
 * for now `protect` ensures only authenticated users can access these.
 *
 * Base mount point (defined in server.js):
 *   /api/pricing-config
 *
 * Routes:
 *   GET  /api/pricing-config                         → getPricingConfig
 *   PUT  /api/pricing-config                         → updatePricingConfig
 *   POST /api/pricing-config/calculate/:quotationId  → calculateQuote
 */

const express = require('express');
const { protect } = require('../middleware/auth');
const {
    getPricingConfig,
    updatePricingConfig,
    calculateQuote,
} = require('../controllers/pricingController');

const router = express.Router();

// ── Config CRUD ─────────────────────────────────────────────
router
    .route('/')
    .get(protect, getPricingConfig)
    .put(protect, updatePricingConfig);

// ── Pricing Engine ─────────────────────────────────────────
router
    .route('/calculate/:quotationId')
    .post(protect, calculateQuote);

module.exports = router;
