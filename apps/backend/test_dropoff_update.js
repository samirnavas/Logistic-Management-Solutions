// Test script to reproduce the Drop-off update issue
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/logistics-db')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

const Quotation = require('./models/Quotation');

async function testDropOffUpdate() {
    try {
        console.log('\n🧪 Testing Drop-off Update Logic\n');

        // Find a quotation with VERIFIED status
        const quotation = await Quotation.findOne({ status: 'VERIFIED' });

        if (!quotation) {
            console.log('⚠️  No quotation found with VERIFIED status');
            console.log('Creating a test quotation...');

            // Create a test quotation
            const testQuotation = new Quotation({
                clientId: new mongoose.Types.ObjectId(),
                items: [{
                    description: 'Test Item',
                    quantity: 1,
                    weight: 1,
                    category: 'General'
                }],
                cargoType: 'General Cargo',
                status: 'VERIFIED'
            });

            await testQuotation.save();
            console.log('✅ Created test quotation:', testQuotation._id);
            console.log('   Status:', testQuotation.status);
        } else {
            console.log('📦 Found quotation:', quotation._id);
            console.log('   Current Status:', quotation.status);
            console.log('   Handover Method:', quotation.handoverMethod);
        }

        // Simulate the update that the client app would send
        const updateData = {
            handoverMethod: 'DROP_OFF',
            warehouseDropOffLocation: 'Warehouse A, 123 Main St',
            destination: {
                name: 'John Doe',
                phone: '+1234567890',
                addressLine: '456 Delivery St',
                city: 'Test City',
                state: 'Test State',
                country: 'Test Country',
                zip: '12345'
            }
        };

        console.log('\n📝 Simulating client update with:');
        console.log('   handoverMethod:', updateData.handoverMethod);
        console.log('   destination:', updateData.destination.city);

        // Apply the logic from our updateQuotation function
        const currentQuotation = quotation || await Quotation.findOne({ status: 'VERIFIED' });

        if (currentQuotation) {
            console.log('\n🔍 Checking conditions:');
            console.log('   currentQuotation.status:', currentQuotation.status);
            console.log('   IS VERIFIED?', currentQuotation.status === 'VERIFIED');
            console.log('   IS APPROVED?', currentQuotation.status === 'APPROVED');
            console.log('   Should update status?', currentQuotation.status === 'VERIFIED' || currentQuotation.status === 'APPROVED');

            // Apply our logic
            if (updateData.handoverMethod === 'DROP_OFF') {
                console.log('\n✅ DROP_OFF detected - injecting placeholder pickup address');
                updateData.pickupAddress = 'CLIENT WILL DROP OFF AT WAREHOUSE';
            }

            if (currentQuotation.status === 'VERIFIED' || currentQuotation.status === 'APPROVED') {
                console.log('✅ Status is VERIFIED/APPROVED - setting status to ADDRESS_PROVIDED');
                updateData.status = 'ADDRESS_PROVIDED';
            }

            console.log('\n📤 Final updateData:');
            console.log(JSON.stringify(updateData, null, 2));

            // Perform the update
            const updatedQuotation = await Quotation.findByIdAndUpdate(
                currentQuotation._id,
                updateData,
                { new: true, runValidators: false }
            );

            console.log('\n✅ Update successful!');
            console.log('   New Status:', updatedQuotation.status);
            console.log('   Handover Method:', updatedQuotation.handoverMethod);
            console.log('   Pickup Address:', updatedQuotation.pickupAddress);
            console.log('   Warehouse Location:', updatedQuotation.warehouseDropOffLocation);
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

testDropOffUpdate();
