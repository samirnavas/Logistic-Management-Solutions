/**
 * pricingController.js
 *
 * Handles all HTTP interactions for the Pricing Configuration system
 * and the Automated Pricing Engine.
 *
 * Routes (mounted at /api/pricing-config):
 * ──────────────────────────────────────────────────────────────────
 *  GET  /api/pricing-config
 *    → getPricingConfig  — Fetch the current global pricing config.
 *    → Access: Admin (private)
 *
 *  PUT  /api/pricing-config
 *    → updatePricingConfig — Update the global pricing config.
 *    → Access: Admin (private)
 *
 *  POST /api/pricing-config/calculate/:quotationId
 *    → calculateQuote — Run the pricing engine against a quotation.
 *    → Access: Admin (private)
 *    → Body: { transportMode: 'Air' | 'Sea' }
 */

const PricingConfig = require('../models/PricingConfig');
const { calculateEstimatedQuote } = require('../services/pricingCalculatorService');

// ─────────────────────────────────────────────────────────────
// GET /api/pricing-config
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Fetch the current global pricing configuration
 * @route   GET /api/pricing-config
 * @access  Private (Admin)
 */
exports.getPricingConfig = async (req, res) => {
    try {
        const config = await PricingConfig.getSingleton();

        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'Pricing configuration not found. Please contact the system administrator.',
            });
        }

        return res.status(200).json({
            success: true,
            data: config,
        });

    } catch (error) {
        console.error('[PricingConfig] GET error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching pricing configuration.',
            error: error.message,
        });
    }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/pricing-config
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Update the global pricing configuration
 * @route   PUT /api/pricing-config
 * @access  Private (Admin)
 *
 * BODY    Accepts a PARTIAL object — only include fields you want to update.
 *         Deep-nested fields are fully replaced when their parent is included.
 *         Use dot-notation keys for precise updates (handled by $set in the model).
 *
 * EXAMPLES
 *   Change only air price per KG:
 *     { "transportRates": { "air": { "pricePerKg": 6.00, "pricePerCbm": 350 } } }
 *
 *   Change only customs clearance fee:
 *     { "standardFees": { "customsClearance": 90, "handlingFee": 50, "fuelSurchargePercentage": 8 } }
 *
 * FORBIDDEN FIELDS
 *   configKey, _id, createdAt — silently stripped before update.
 */
exports.updatePricingConfig = async (req, res) => {
    try {
        // --- Guard: ensure the singleton already exists -------------
        const existing = await PricingConfig.findOne({ configKey: 'GLOBAL' });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Pricing configuration does not exist. Run the server seeder first.',
            });
        }

        // --- Strip immutable / reserved fields ----------------------
        const { configKey, _id, createdAt, __v, ...updates } = req.body;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Request body is empty. Provide at least one field to update.',
            });
        }

        // --- Flatten nested objects into dot-notation for $set ------
        // This ensures partial nested updates (e.g. only pricePerKg inside air)
        // do NOT wipe out sibling fields.
        const flatUpdates = flattenObject(updates);

        const adminId = req.user?._id ?? null;
        if (adminId) flatUpdates.lastUpdatedBy = adminId;

        const updated = await PricingConfig.findOneAndUpdate(
            { configKey: 'GLOBAL' },
            { $set: flatUpdates },
            { new: true, runValidators: true }
        ).lean();

        console.log(`[PricingConfig] Updated by admin ${adminId} at ${new Date().toISOString()}`);

        return res.status(200).json({
            success: true,
            message: 'Pricing configuration updated successfully.',
            data: updated,
        });

    } catch (error) {
        console.error('[PricingConfig] PUT error:', error);

        // Mongoose validation error → 400
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed.',
                errors: messages,
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Server error while updating pricing configuration.',
            error: error.message,
        });
    }
};

// ─────────────────────────────────────────────────────────────
// POST /api/pricing-config/calculate/:quotationId
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Run the automated pricing engine against a quotation
 * @route   POST /api/pricing-config/calculate/:quotationId
 * @access  Private (Admin)
 *
 * PARAMS  quotationId — MongoDB ObjectId of the Quotation
 * BODY    { transportMode: 'Air' | 'Sea' }
 *           transportMode defaults to 'Air' if omitted.
 *
 * RETURNS A fully itemized pricing receipt:
 *   {
 *     success,
 *     data: {
 *       quotationId, quotationNumber, currency,
 *       transportMode, deliveryMode,
 *       breakdown: { items[], deliveryModeAddon, standardFees, subtotals },
 *       grandTotal,
 *       calculatedAt,
 *     }
 *   }
 */
exports.calculateQuote = async (req, res) => {
    try {
        const { quotationId } = req.params;
        const { transportMode = 'Air' } = req.body;

        // --- Input validation ---------------------------------------
        if (!quotationId) {
            return res.status(400).json({
                success: false,
                message: 'quotationId is required as a URL parameter.',
            });
        }

        if (!['Air', 'Sea'].includes(transportMode)) {
            return res.status(400).json({
                success: false,
                message: "transportMode must be 'Air' or 'Sea'.",
            });
        }

        // --- Run the pricing engine ---------------------------------
        const receipt = await calculateEstimatedQuote(quotationId, transportMode);

        return res.status(200).json({
            success: true,
            data: receipt,
        });

    } catch (error) {
        console.error('[PricingEngine] calculateQuote error:', error);

        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            message: error.message || 'Server error while calculating quote.',
        });
    }
};

// ─────────────────────────────────────────────────────────────
// Internal helper — flatten nested object to dot-notation keys
// ─────────────────────────────────────────────────────────────

/**
 * flattenObject
 *
 * Converts a nested object into flat dot-notation keys safe for MongoDB $set.
 *
 * Example:
 *   { transportRates: { air: { pricePerKg: 6 } } }
 * becomes:
 *   { 'transportRates.air.pricePerKg': 6 }
 *
 * This is critical: without flattening, a $set on 'transportRates' would
 * REPLACE the entire transportRates sub-document, wiping sibling fields.
 *
 * @param {Object} obj     Source object (may be deeply nested)
 * @param {string} prefix  Internal — current key prefix (leave empty on first call)
 * @returns {Object}       Flat { 'a.b.c': value } object
 */
function flattenObject(obj, prefix = '') {
    const result = {};

    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (
            value !== null &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            !(value instanceof Date)
        ) {
            // Recurse into nested objects
            Object.assign(result, flattenObject(value, fullKey));
        } else {
            result[fullKey] = value;
        }
    }

    return result;
}
