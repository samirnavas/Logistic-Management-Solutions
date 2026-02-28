const mongoose = require('mongoose');
const Quotation = require('./models/Quotation');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/logistic_manage');
    const q = await Quotation.findOne({ status: { $ne: 'DRAFT' } }).sort({ createdAt: -1 });
    if (!q) {
        console.log('No quotation found');
        return process.exit();
    }
    console.log('Found Quotation:', q.quotationNumber, 'Status:', q.status);

    q.items = [{ description: 'Product Base Price', quantity: 1, unitPrice: 100, amount: 100, category: 'freight' }];
    q.calculateTotals();
    q.status = 'QUOTATION_GENERATED'; // try to mock update

    try {
        await q.save();
        console.log('Save successful');
    } catch (err) {
        console.log('SAVE FAILED:');
        console.log(JSON.stringify(err.errors || err, null, 2));
    }
    process.exit();
}

check();
