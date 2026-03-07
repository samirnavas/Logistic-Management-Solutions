/**
 * pricingCalculatorService.js
 *
 * Pure business-logic service — no HTTP req/res here.
 * Can be called from any controller or internal utility.
 *
 * CURRENCY MODEL
 * ══════════════
 * All PricingConfig rates are stored in INR.
 * When a quotation has a different currency (e.g. USD, EUR, AED),
 * the final receipt is converted using the exchange rates stored in
 * PricingConfig.exchangeRates (1 INR = X <currency>).
 *
 * Conversion happens once at the end, after the full INR total is
 * computed — this keeps the calculation logic simple and avoids
 * rounding drift from per-field conversions.
 *
 * CALCULATION PIPELINE
 * ════════════════════
 *
 *  For each line item in the quotation:
 *
 *  1. PARSE DIMENSIONS  → derive L, W, H from item.dimensions
 *
 *  2. COMPUTE CBM       → (L × W × H × quantity) ÷ 1,000,000
 *
 *  3. BASE FREIGHT (INR)
 *       Air  → max(pricePerKg × totalWeight, pricePerCbm × cbm)
 *       Sea  → pricePerCbm × cbm
 *
 *  4. CATEGORY SURCHARGE → from PricingConfig.itemCategories
 *
 *  5. DELIVERY MODE ADDON → flat INR fee for the whole shipment
 *
 *  6. STANDARD FEES (INR)
 *       customsClearance  – flat
 *       handlingFee       – flat
 *       fuelSurcharge     – % of total base freight
 *
 *  7. GRAND TOTAL (INR)
 *
 *  8. CURRENCY CONVERSION
 *       if quotation.currency !== 'INR', multiply every monetary
 *       value by the stored exchange rate before returning.
 *
 * OUTPUT SHAPE
 * ════════════
 * {
 *   quotationId,
 *   quotationNumber,
 *   currency,           // quotation's requested currency
 *   baseCurrency,       // always 'INR'
 *   exchangeRate,       // rate applied (1 INR = <exchangeRate> <currency>)
 *   transportMode,      // 'Air' | 'Sea'
 *   deliveryMode,
 *   breakdown: {
 *     items: [{ description, quantity, weightKg, totalWeightKg,
 *               dimensions, cbm, baseFreightCharge,
 *               categorySurcharge: { category, type, rate, amount },
 *               lineTotal }],        // all in output currency
 *     deliveryModeAddon: { label, amount },
 *     standardFees: { customsClearance, handlingFee,
 *                     fuelSurcharge: { percentage, amount }, total },
 *     subtotals: { baseFreight, categorySurcharges, deliveryAddon, standardFees },
 *   },
 *   grandTotal,          // in output currency
 *   grandTotalINR,       // always the raw INR total (for admin reference)
 *   calculatedAt,
 * }
 */

const Quotation = require('../models/Quotation');
const PricingConfig = require('../models/PricingConfig');

// ─────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────

function parseDimensions(raw) {
    if (!raw) return null;

    if (typeof raw === 'object') {
        const L = raw.L ?? raw.l ?? raw.length ?? raw.Length;
        const W = raw.W ?? raw.w ?? raw.width ?? raw.Width;
        const H = raw.H ?? raw.h ?? raw.height ?? raw.Height;
        if ([L, W, H].every(v => typeof v === 'number' && v > 0)) return { L, W, H };
        return null;
    }

    if (typeof raw === 'string' && raw !== 'N/A') {
        const parts = raw.split(/[x×*,]/i).map(p => parseFloat(p.trim()));
        if (parts.length === 3 && parts.every(v => !isNaN(v) && v > 0)) {
            return { L: parts[0], W: parts[1], H: parts[2] };
        }
    }

    return null;
}

function computeCbm(dims, quantity = 1) {
    if (!dims) return 0;
    return (dims.L * dims.W * dims.H * quantity) / 1_000_000;
}

function resolveCategoryKey(category = 'General', isHazardous = false) {
    if (isHazardous) return 'harmfulHazardous';
    const hazardousCategories = new Set(['Harmful', 'Explosive', 'harmful', 'explosive']);
    if (hazardousCategories.has(category)) return 'harmfulHazardous';
    if (category === 'Special') return 'fragile';
    return 'general';
}

function applySurcharge(surchargeConfig, baseAmount = 0) {
    if (!surchargeConfig || surchargeConfig.value === 0) return 0;
    if (surchargeConfig.type === 'percentage') {
        return (baseAmount * surchargeConfig.value) / 100;
    }
    return surchargeConfig.value;
}

function deliveryModeLabel(serviceMode) {
    const labels = {
        door_to_door: 'Door-to-Door',
        door_to_warehouse: 'Door-to-Warehouse',
        warehouse_to_door: 'Warehouse-to-Door',
        warehouse_to_warehouse: 'Warehouse-to-Warehouse',
    };
    return labels[serviceMode] || serviceMode;
}

function deliveryModeRate(deliveryModes, serviceMode) {
    const map = {
        door_to_door: deliveryModes.doorToDoor,
        door_to_warehouse: deliveryModes.doorToWarehouse,
        warehouse_to_door: deliveryModes.warehouseToDoor,
        warehouse_to_warehouse: deliveryModes.warehouseToWarehouse,
    };
    return map[serviceMode] ?? 0;
}

/**
 * getExchangeRate
 *
 * Returns the exchange rate from INR to the target currency.
 * • If currency === 'INR', returns 1 (no conversion).
 * • Falls back to 1 (treats as INR) if the currency is unknown,
 *   so the system degrades gracefully rather than crashing.
 *
 * @param {Object} exchangeRates  PricingConfig.exchangeRates
 * @param {string} targetCurrency  e.g. 'USD', 'EUR', 'INR'
 * @returns {number}  Multiplier to apply: INR amount × rate = output amount
 */
function getExchangeRate(exchangeRates, targetCurrency) {
    if (!targetCurrency || targetCurrency === 'INR') return 1;
    const rate = exchangeRates?.[targetCurrency];
    if (!rate || rate <= 0) {
        console.warn(`[PricingEngine] No exchange rate found for ${targetCurrency}. Returning raw INR values.`);
        return 1;
    }
    return rate;
}

/**
 * convertAmount
 *
 * Multiplies an INR amount by the exchange rate and rounds to 2dp.
 *
 * @param {number} inrAmount
 * @param {number} rate
 * @returns {number}
 */
function convertAmount(inrAmount, rate) {
    return parseFloat((inrAmount * rate).toFixed(2));
}

// ─────────────────────────────────────────────────────────────
// Public service function
// ─────────────────────────────────────────────────────────────

/**
 * calculateEstimatedQuote
 *
 * Fetches a Quotation by its MongoDB _id, then applies the global
 * PricingConfig rules (all in INR) to produce a fully itemized
 * receipt. The final totals are converted to the quotation's
 * requested currency before returning.
 *
 * @param {string} quotationId   MongoDB ObjectId string
 * @param {string} transportMode 'Air' | 'Sea'
 * @returns {Promise<Object>}    Structured itemized receipt
 * @throws {Error}               If quotation not found or config missing
 */
async function calculateEstimatedQuote(quotationId, transportMode = 'Air') {
    // ── 0. Load data ─────────────────────────────────────────
    const [quotation, config] = await Promise.all([
        Quotation.findById(quotationId).lean(),
        PricingConfig.getSingleton(),
    ]);

    if (!quotation) {
        const err = new Error(`Quotation not found: ${quotationId}`);
        err.statusCode = 404;
        throw err;
    }

    if (!config) {
        const err = new Error('PricingConfig singleton not found. Run the seeder first.');
        err.statusCode = 500;
        throw err;
    }

    const mode = transportMode === 'Sea' ? 'Sea' : 'Air';
    const quotationCurrency = quotation.currency || 'USD';

    // ── Currency conversion setup ─────────────────────────────
    const rate = getExchangeRate(config.exchangeRates, quotationCurrency);
    const isINR = quotationCurrency === 'INR';

    // ── 1. Resolve delivery mode addon ────────────────────────
    const deliveryAddonINR = deliveryModeRate(config.deliveryModes, quotation.serviceMode);

    const items = quotation.items || [];
    const itemCount = items.length || 1;
    const addonPerItemINR = deliveryAddonINR / itemCount;   // for per-item breakdown

    // ── 2. Process each line item (all math in INR) ───────────
    const processedItems = [];
    let totalBaseFreightINR = 0;
    let totalSurchargesINR = 0;

    for (const item of items) {
        const qty = item.quantity ?? 1;
        const weight = (item.weight ?? 0) * qty;

        const dims = parseDimensions(item.dimensions);
        const cbm = computeCbm(dims, qty);

        // Step 3: Base freight (INR)
        let baseFreightINR = 0;
        if (mode === 'Air') {
            const byWeight = config.transportRates.air.pricePerKg * weight;
            const byCbm = config.transportRates.air.pricePerCbm * cbm;
            baseFreightINR = Math.max(byWeight, byCbm);
        } else {
            baseFreightINR = config.transportRates.sea.pricePerCbm * cbm;
        }

        // Step 4: Category surcharge (INR if flat, % of baseFreight if percentage)
        const categoryKey = resolveCategoryKey(item.category, item.isHazardous);
        const surchargeConfig = config.itemCategories[categoryKey];
        const surchargeINR = applySurcharge(surchargeConfig, baseFreightINR);

        const lineTotalINR = baseFreightINR + surchargeINR;

        totalBaseFreightINR += baseFreightINR;
        totalSurchargesINR += surchargeINR;

        processedItems.push({
            description: item.description,
            quantity: qty,
            weightKg: item.weight ?? 0,
            totalWeightKg: weight,
            dimensions: dims
                ? `${dims.L}cm × ${dims.W}cm × ${dims.H}cm`
                : (typeof item.dimensions === 'string' ? item.dimensions : 'N/A'),
            cbm: parseFloat(cbm.toFixed(4)),
            // Converted to quotation currency
            baseFreightCharge: convertAmount(baseFreightINR, rate),
            categorySurcharge: {
                category: categoryKey,
                type: surchargeConfig.type,
                // Rate shown in INR if flat (for transparency), or as % (no conversion needed)
                rate: surchargeConfig.type === 'flat'
                    ? convertAmount(surchargeConfig.value, rate)
                    : surchargeConfig.value,
                amount: convertAmount(surchargeINR, rate),
            },
            lineTotal: convertAmount(lineTotalINR, rate),
            // INR originals for audit
            _inr: {
                baseFreight: parseFloat(baseFreightINR.toFixed(2)),
                surcharge: parseFloat(surchargeINR.toFixed(2)),
                lineTotal: parseFloat(lineTotalINR.toFixed(2)),
            },
        });
    }

    // ── 6. Standard fees (INR) ────────────────────────────────
    const fuelSurchargeINR = (config.standardFees.fuelSurchargePercentage / 100) * totalBaseFreightINR;
    const standardFeesTotalINR =
        config.standardFees.customsClearance +
        config.standardFees.handlingFee +
        fuelSurchargeINR;

    // ── 7. Grand total (INR) ──────────────────────────────────
    const grandTotalINR =
        totalBaseFreightINR +
        totalSurchargesINR +
        deliveryAddonINR +
        standardFeesTotalINR;

    // ── 8. Build and return the structured receipt ───────────
    return {
        quotationId: quotation._id,
        quotationNumber: quotation.quotationNumber,
        currency: quotationCurrency,
        baseCurrency: 'INR',
        exchangeRate: rate,
        isConverted: !isINR,
        transportMode: mode,
        deliveryMode: quotation.serviceMode,

        breakdown: {
            items: processedItems,

            deliveryModeAddon: {
                label: deliveryModeLabel(quotation.serviceMode),
                amount: convertAmount(deliveryAddonINR, rate),
                amountINR: parseFloat(deliveryAddonINR.toFixed(2)),
            },

            standardFees: {
                customsClearance: convertAmount(config.standardFees.customsClearance, rate),
                handlingFee: convertAmount(config.standardFees.handlingFee, rate),
                fuelSurcharge: {
                    percentage: config.standardFees.fuelSurchargePercentage,
                    amount: convertAmount(fuelSurchargeINR, rate),
                    amountINR: parseFloat(fuelSurchargeINR.toFixed(2)),
                },
                total: convertAmount(standardFeesTotalINR, rate),
            },

            subtotals: {
                baseFreight: convertAmount(totalBaseFreightINR, rate),
                categorySurcharges: convertAmount(totalSurchargesINR, rate),
                deliveryAddon: convertAmount(deliveryAddonINR, rate),
                standardFees: convertAmount(standardFeesTotalINR, rate),
                // Raw INR subtotals for admin reference
                _inr: {
                    baseFreight: parseFloat(totalBaseFreightINR.toFixed(2)),
                    categorySurcharges: parseFloat(totalSurchargesINR.toFixed(2)),
                    deliveryAddon: parseFloat(deliveryAddonINR.toFixed(2)),
                    standardFees: parseFloat(standardFeesTotalINR.toFixed(2)),
                },
            },
        },

        grandTotal: convertAmount(grandTotalINR, rate),
        grandTotalINR: parseFloat(grandTotalINR.toFixed(2)),
        calculatedAt: new Date().toISOString(),
    };
}

module.exports = { calculateEstimatedQuote };
