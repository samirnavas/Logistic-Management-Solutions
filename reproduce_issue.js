const mongoose = require('mongoose');
const Quotation = require('./apps/backend/models/Quotation');

// Mock data based on Flutter request_shipment_screen.dart
const mockData = {
    clientId: new mongoose.Types.ObjectId(), // Logic assumes this is a valid ID
    origin: {
        name: 'Test Name',
        phone: '+91 1234567890',
        addressLine: '123 St',
        city: 'Test City',
        state: 'Test State',
        country: 'India',
        zip: '10001',
        addressType: 'Home'
    },
    destination: {
        name: 'To Be Confirmed',
        phone: '9999999999',
        addressLine: 'To Be Confirmed',
        city: 'To Be Confirmed',
        state: '',
        country: 'To Be Confirmed',
        zip: '00000'
    },
    items: [{
        description: 'Test Item',
        quantity: 5,
        weight: 10.5,
        dimensions: '10x10x10',
        images: [],
        category: 'General',
        isHazardous: false,
        hsCode: '123456',
        videoUrl: '',
        targetRate: 0,
        packingVolume: 0.001,
        unitPrice: 0,
        amount: 0
    }],
    cargoType: 'General Cargo',
    serviceType: 'Standard',
    specialInstructions: 'Mode: By Air, Delivery: Door to Door\nNotes: Test',
    pickupDate: new Date().toISOString(),
    status: 'request_sent',
    totalAmount: 0
};

async function testValidation() {
    try {
        const doc = new Quotation(mockData);
        await doc.validate();
        console.log('Validation Successful!');
    } catch (error) {
        console.error('Validation Failed:', error.message);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`Field: ${key}, Error: ${error.errors[key].message}`);
            });
        }
    }
}

testValidation();
