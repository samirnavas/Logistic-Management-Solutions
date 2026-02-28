const fetch = require('node-fetch');
const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    // 1. Get a mock JWT token for an admin
    // Or just use the DB to find a quotation ID and skip auth for a direct DB test? 
    // We already did DB direct test. We need to test the router!

    // We can't easily forge a JWT token without knowing the secret, actually we HAVE the secret:
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: '64d4c5f9...', role: 'manager' }, process.env.JWT_SECRET || 'mySuperSecretKey123', { expiresIn: '1h' });

    // Connect to DB to get a valid request ID
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/logistic_manage');
    const Quotation = require('./models/Quotation');
    const q = await Quotation.findOne({ status: { $ne: 'DRAFT' } }).sort({ createdAt: -1 });
    if (!q) {
        console.log('No Quotation');
        process.exit();
    }

    // Test the API directly
    const payload = {
        items: [{ description: 'Product Base Price', quantity: 1, unitPrice: 1000, amount: 1000, weight: 0, dimensions: 'N/A', category: 'freight' }],
        taxRate: 10,
        discount: 0,
        additionalNotes: '',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'QUOTATION_GENERATED'
    };

    try {
        const res = await fetch(`http://localhost:5000/api/quotations/${q._id}/update-price`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json();
            console.log('API FAILED:', err);
        } else {
            console.log('API SUCCEEDED!');
        }
    } catch (e) {
        console.log('FETCH ERROR:', e);
    }
    process.exit();
}
run();
