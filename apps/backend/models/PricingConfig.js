const mongoose = require('mongoose');

// ============================================================
//  PricingConfig — Singleton Mongoose Model
//
//  Design intent:
//    • Only ONE document ever lives in the `pricingconfigs`
//      collection. The singleton invariant is enforced by:
//        1. A unique, constant `configKey` field (value = 'GLOBAL').
//        2. A unique sparse index on that field.
//        3. In application code, always use
//           PricingConfig.getSingleton() / PricingConfig.updateSingleton()
//           instead of create() / save() directly.
//
//  Currency model:
//    • ALL monetary rates stored in INR (Indian Rupee).
//    • baseCurrency is always 'INR'.
//    • exchangeRates stores INR → X conversion rates (1 INR = ? X)
//      so the Pricing Calculator can convert the final INR total
//      into whatever currency the quotation was requested in.
// ============================================================

// ----------------------------------------------------------
// Sub-schemas
// ----------------------------------------------------------

/** A surcharge that is either a flat amount (INR) or a percentage. */
const surchargeSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['flat', 'percentage'],
            required: true,
            default: 'flat',
        },
        value: {
            type: Number,
            required: true,
            min: [0, 'Surcharge value cannot be negative'],
            default: 0,
        },
    },
    { _id: false }
);

/** Exchange rate from INR to a target currency: 1 INR = <value> <currency> */
const exchangeRateSchema = new mongoose.Schema(
    {
        USD: { type: Number, default: 0.012, min: 0 },
        EUR: { type: Number, default: 0.011, min: 0 },
        GBP: { type: Number, default: 0.0095, min: 0 },
        AED: { type: Number, default: 0.044, min: 0 },
        CNY: { type: Number, default: 0.086, min: 0 },
        JPY: { type: Number, default: 1.80, min: 0 },
        // INR → INR is always 1 (no conversion needed)
    },
    { _id: false }
);

// ----------------------------------------------------------
// Main schema
// ----------------------------------------------------------

const pricingConfigSchema = new mongoose.Schema(
    {
        /**
         * Singleton key – never change this value.
         * The unique index guarantees only one document exists.
         */
        configKey: {
            type: String,
            default: 'GLOBAL',
            immutable: true,
            enum: ['GLOBAL'],
        },

        /**
         * Base currency for all stored rates.
         * Always 'INR'. Stored explicitly so consuming code
         * never makes assumptions.
         */
        baseCurrency: {
            type: String,
            default: 'INR',
            immutable: true,
            enum: ['INR'],
        },

        /**
         * Exchange rates from INR to supported quotation currencies.
         * 1 INR = exchangeRates.<currency>
         * Admin can update these to keep rates current.
         */
        exchangeRates: {
            type: exchangeRateSchema,
            default: () => ({}),
        },

        // -------------------------------------------------------
        // 1. Transport Rates  (all values in INR)
        // -------------------------------------------------------
        transportRates: {
            air: {
                pricePerKg: {
                    type: Number,
                    required: true,
                    min: [0, 'Air price per KG cannot be negative'],
                    default: 450,
                },
                pricePerCbm: {
                    type: Number,
                    required: true,
                    min: [0, 'Air price per CBM cannot be negative'],
                    default: 28000,
                },
            },
            sea: {
                pricePerCbm: {
                    type: Number,
                    required: true,
                    min: [0, 'Sea price per CBM cannot be negative'],
                    default: 7000,
                },
            },
        },

        // -------------------------------------------------------
        // 2. Delivery Mode Addons  (flat INR additions)
        // -------------------------------------------------------
        deliveryModes: {
            doorToDoor: {
                type: Number,
                required: true,
                min: [0, 'Door-to-Door rate cannot be negative'],
                default: 12500,
            },
            doorToWarehouse: {
                type: Number,
                required: true,
                min: [0, 'Door-to-Warehouse rate cannot be negative'],
                default: 6500,
            },
            warehouseToDoor: {
                type: Number,
                required: true,
                min: [0, 'Warehouse-to-Door rate cannot be negative'],
                default: 6500,
            },
            warehouseToWarehouse: {
                type: Number,
                required: true,
                min: [0, 'Warehouse-to-Warehouse rate cannot be negative'],
                default: 0,
            },
        },

        // -------------------------------------------------------
        // 3. Item Category Surcharges
        //    Flat values are in INR; percentage values are unit-less.
        // -------------------------------------------------------
        itemCategories: {
            general: {
                type: surchargeSchema,
                default: () => ({ type: 'flat', value: 0 }),
            },
            fragile: {
                type: surchargeSchema,
                default: () => ({ type: 'flat', value: 2000 }),
            },
            harmfulHazardous: {
                type: surchargeSchema,
                default: () => ({ type: 'percentage', value: 15 }),
            },
        },

        // -------------------------------------------------------
        // 4. Standard Fees  (flat INR or percentage)
        // -------------------------------------------------------
        standardFees: {
            customsClearance: {
                type: Number,
                required: true,
                min: [0, 'Customs clearance fee cannot be negative'],
                default: 6000,
            },
            handlingFee: {
                type: Number,
                required: true,
                min: [0, 'Handling fee cannot be negative'],
                default: 4000,
            },
            fuelSurchargePercentage: {
                type: Number,
                required: true,
                min: [0, 'Fuel surcharge percentage cannot be negative'],
                max: [100, 'Fuel surcharge percentage cannot exceed 100%'],
                default: 8,
            },
        },

        lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: true,
        collection: 'pricingconfigs',
    }
);

pricingConfigSchema.index({ configKey: 1 }, { unique: true });

// ----------------------------------------------------------
// Static helpers
// ----------------------------------------------------------

pricingConfigSchema.statics.getSingleton = async function () {
    return this.findOne({ configKey: 'GLOBAL' }).lean();
};

pricingConfigSchema.statics.updateSingleton = async function (updates, adminUserId) {
    if (adminUserId) {
        updates.lastUpdatedBy = adminUserId;
    }

    return this.findOneAndUpdate(
        { configKey: 'GLOBAL' },
        { $set: updates },
        {
            new: true,
            runValidators: true,
            upsert: false,
        }
    ).lean();
};

module.exports = mongoose.model('PricingConfig', pricingConfigSchema);
