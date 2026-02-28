const mongoose = require('mongoose');
require('dotenv').config();
const Quotation = require('./models/Quotation');

async function testFrontendPayload() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/logistic_manage');

    const quotation = await Quotation.findOne({ status: { $ne: 'DRAFT' } }).sort({ createdAt: -1 });
    if (!quotation) {
        console.log('No Quotation found!');
        process.exit();
    }

    console.log('Testing on:', quotation.quotationNumber, 'Current status:', quotation.status);

    // Mock frontend variables
    const productBasePrice = 1000;
    const deliveryCharges = 200;
    const packagingCharges = 50;
    const insuranceCharges = 100;
    const taxAmount = 135;

    // Convert price breakdown into line items format (EXACTLY like frontend)
    const items = [];
    if (productBasePrice > 0) {
        items.push({
            description: 'Product Base Price',
            quantity: 1,
            unitPrice: productBasePrice,
            amount: productBasePrice,
            weight: 0,
            dimensions: 'N/A',
            category: 'freight'
        });
    }
    if (deliveryCharges > 0) {
        items.push({
            description: 'Delivery/Transportation Charges',
            quantity: 1,
            unitPrice: deliveryCharges,
            amount: deliveryCharges,
            weight: 0,
            dimensions: 'N/A',
            category: 'freight'
        });
    }
    if (packagingCharges > 0) {
        items.push({
            description: 'Packaging Charges',
            quantity: 1,
            unitPrice: packagingCharges,
            amount: packagingCharges,
            weight: 0,
            dimensions: 'N/A',
            category: 'handling'
        });
    }
    if (insuranceCharges > 0) {
        items.push({
            description: 'Insurance Charges',
            quantity: 1,
            unitPrice: insuranceCharges,
            amount: insuranceCharges,
            weight: 0,
            dimensions: 'N/A',
            category: 'insurance'
        });
    }
    if (taxAmount > 0) {
        items.push({
            description: `Taxes (GST 10%)`,
            quantity: 1,
            unitPrice: taxAmount,
            amount: taxAmount,
            weight: 0,
            dimensions: 'N/A',
            category: 'other'
        });
    }

    const payload = {
        items: items.length > 0 ? items : [{ description: 'Service Charge', quantity: 1, unitPrice: 0, amount: 0, category: 'other' }],
        taxRate: 10,
        discount: Number(0),
        additionalNotes: '',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'QUOTATION_GENERATED'
    };

    // Simulated controller logic
    if (payload.items) quotation.items = payload.items;
    if (payload.taxRate !== undefined) quotation.taxRate = payload.taxRate;
    if (payload.discount !== undefined) quotation.discount = payload.discount;
    if (payload.additionalNotes !== undefined) quotation.additionalNotes = payload.additionalNotes;
    if (payload.validUntil !== undefined) quotation.validUntil = payload.validUntil;
    quotation.status = payload.status || 'QUOTATION_GENERATED';
    quotation.calculateTotals();

    try {
        await quotation.save();
        console.log('SUCCESS! Validation passed.');
    } catch (error) {
        console.log('FAIL! Validation error:', error.message);
        if (error.errors) {
            console.log(JSON.stringify(error.errors, null, 2));
        }
    }
    process.exit();
}

testFrontendPayload();
