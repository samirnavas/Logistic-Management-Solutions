const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Shipment = require('./models/Shipment');

dotenv.config();

const shipments = [
    {
        trackingNumber: 'TRK-BB-78291034',
        origin: 'Shanghai, China',
        destination: 'Los Angeles, USA',
        status: 'In Transit',
        estimatedDelivery: new Date('2026-01-18'),
        packageIds: ['PKG-001', 'PKG-002', 'PKG-003']
    },
    {
        trackingNumber: 'TRK-BB-45632187',
        origin: 'Mumbai, India',
        destination: 'Dubai, UAE',
        status: 'Pending',
        estimatedDelivery: new Date('2026-01-25'),
        packageIds: ['PKG-004']
    },
    {
        trackingNumber: 'TRK-BB-92817364',
        origin: 'Rotterdam, Netherlands',
        destination: 'New York, USA',
        status: 'In Transit',
        estimatedDelivery: new Date('2026-01-20'),
        packageIds: ['PKG-005', 'PKG-006']
    },
    {
        trackingNumber: 'TRK-BB-11293847',
        origin: 'Singapore',
        destination: 'Sydney, Australia',
        status: 'Delivered',
        estimatedDelivery: new Date('2026-01-05'),
        packageIds: ['PKG-007', 'PKG-008', 'PKG-009', 'PKG-010']
    },
    {
        trackingNumber: 'TRK-BB-66574839',
        origin: 'Tokyo, Japan',
        destination: 'Vancouver, Canada',
        status: 'In Transit',
        estimatedDelivery: new Date('2026-01-22'),
        packageIds: ['PKG-011', 'PKG-012']
    },
    {
        trackingNumber: 'TRK-BB-33948271',
        origin: 'Hamburg, Germany',
        destination: 'Santos, Brazil',
        status: 'Pending',
        estimatedDelivery: new Date('2026-02-01'),
        packageIds: ['PKG-013']
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connection Success to database: ${mongoose.connection.name}`);

        await Shipment.deleteMany();
        console.log('Cleared existing shipments');

        await Shipment.insertMany(shipments);
        console.log('Shipments seeded successfully');

        process.exit();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDB();
