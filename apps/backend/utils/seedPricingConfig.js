/**
 * seedPricingConfig.js
 *
 * Initialization utility for the PricingConfig singleton.
 *
 * HOW IT WORKS
 * ────────────
 * Called once during server startup (after DB connection is
 * established). It checks whether a PricingConfig document
 * already exists. If not, it creates one with sensible
 * production-ready default values.
 *
 * The function is fully IDEMPOTENT – safe to call on every
 * server restart without risk of duplication.
 *
 * DEFAULT VALUES — all monetary amounts in INR (Indian Rupee)
 * ────────────────────────────────────────────────────────────
 *  Transport – Air      : ₹450 / KG  |  ₹28,000 / CBM
 *  Transport – Sea/Ship : ₹7,000 / CBM
 *  Delivery  – D2D      : +₹12,500 flat
 *  Delivery  – D2W      : +₹6,500  flat
 *  Delivery  – W2D      : +₹6,500  flat
 *  Delivery  – W2W      : +₹0      flat (no last-mile cost)
 *  Category  – General  :  No surcharge
 *  Category  – Fragile  : +₹2,000  flat
 *  Category  – Harmful  : +15%     of base freight
 *  Fees      – Customs  : +₹6,000  flat
 *  Fees      – Handling : +₹4,000  flat
 *  Fees      – Fuel     : +8%      of base freight
 *
 *  Exchange Rates (1 INR = ?)
 *  USD: 0.012 | EUR: 0.011 | GBP: 0.0095 | AED: 0.044 | CNY: 0.086 | JPY: 1.80
 */

const PricingConfig = require('../models/PricingConfig');

const DEFAULT_CONFIG = {
    configKey: 'GLOBAL',
    baseCurrency: 'INR',

    exchangeRates: {
        USD: 0.012,
        EUR: 0.011,
        GBP: 0.0095,
        AED: 0.044,
        CNY: 0.086,
        JPY: 1.80,
    },

    transportRates: {
        air: {
            pricePerKg: 450,
            pricePerCbm: 28000,
        },
        sea: {
            pricePerCbm: 7000,
        },
    },

    deliveryModes: {
        doorToDoor: 12500,
        doorToWarehouse: 6500,
        warehouseToDoor: 6500,
        warehouseToWarehouse: 0,
    },

    itemCategories: {
        general: {
            type: 'flat',
            value: 0,
        },
        fragile: {
            type: 'flat',
            value: 2000,
        },
        harmfulHazardous: {
            type: 'percentage',
            value: 15,
        },
    },

    standardFees: {
        customsClearance: 6000,
        handlingFee: 4000,
        fuelSurchargePercentage: 8,
    },
};

const seedPricingConfig = async () => {
    try {
        // Use upsert so it creates the document if missing OR migrates an
        // existing old (USD-based) document to INR defaults + adds exchangeRates.
        await PricingConfig.findOneAndUpdate(
            { configKey: 'GLOBAL' },
            { $set: DEFAULT_CONFIG },
            { upsert: true, new: true, runValidators: false }
        );

        console.log('[PricingConfig] ✅ Pricing configuration seeded/migrated to INR base currency.');
        console.log('[PricingConfig] Rates summary:');
        console.log(`  Air Freight  : ₹${DEFAULT_CONFIG.transportRates.air.pricePerKg}/KG | ₹${DEFAULT_CONFIG.transportRates.air.pricePerCbm}/CBM`);
        console.log(`  Sea Freight  : ₹${DEFAULT_CONFIG.transportRates.sea.pricePerCbm}/CBM`);
        console.log(`  D2D Addon    : ₹${DEFAULT_CONFIG.deliveryModes.doorToDoor}`);
        console.log(`  Customs Fee  : ₹${DEFAULT_CONFIG.standardFees.customsClearance}`);
        console.log(`  Handling Fee : ₹${DEFAULT_CONFIG.standardFees.handlingFee}`);
        console.log(`  Fuel Surch.  : ${DEFAULT_CONFIG.standardFees.fuelSurchargePercentage}%`);
        console.log(`  Exch. Rates  : 1 INR = $${DEFAULT_CONFIG.exchangeRates.USD} | €${DEFAULT_CONFIG.exchangeRates.EUR} | £${DEFAULT_CONFIG.exchangeRates.GBP} | د.إ${DEFAULT_CONFIG.exchangeRates.AED}`);

    } catch (error) {
        console.error('[PricingConfig] ❌ Failed to seed default configuration:', error.message);
    }
};

module.exports = seedPricingConfig;

