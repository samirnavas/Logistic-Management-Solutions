const mongoose = require('mongoose');
const Quotation = require('./apps/backend/models/Quotation');
require('dotenv').config({ path: './apps/backend/.env' });

async function check() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/logistic_manage');
    const q = await Quotation.findOne({ status: { $ne: 'DRAFT' } });
    if (!q) {
        console.log('No quotation found');
        return process.exit();
    }
    console.log('Found Quotation:', q.quotationNumber);

    q.items = [{ description: 'Product Base Price', quantity: 1, unitPrice: 100, amount: 100, category: 'freight' }];
    q.calculateTotals();

    try {
        await q.save();
        console.log('Save successful');
    } catch (err) {
        console.log('SAVE FAILED:', err.message);
    }
    process.exit();
}

check();
