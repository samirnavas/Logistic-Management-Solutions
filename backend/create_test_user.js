// backend/create_test_user.js
require('dotenv').config(); // Load env variables (MONGO_URI)
const mongoose = require('mongoose');
const User = require('./models/User'); // Import your User model

const createTestUser = async () => {
    try {
        // 1. Connect to Database
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');

        // 2. Define the Test User Data
        const testUserData = {
            fullName: 'Test User',
            email: 'test@example.com',
            password: 'password123', // This will be hashed automatically by your User model
            phone: '1234567890',
            role: 'client',
            country: 'TestLand',
            // We leave savedAddresses empty to avoid validation errors for now
            savedAddresses: []
        };

        // 3. Check if user already exists
        const existingUser = await User.findOne({ email: testUserData.email });
        if (existingUser) {
            console.log('⚠️ Test user already exists!');
            console.log('Email:', existingUser.email);
            // We can't show the password because it's hashed, but you can try logging in.
            process.exit(0);
        }

        // 4. Create and Save
        const newUser = new User(testUserData);
        await newUser.save();

        console.log('==========================================');
        console.log('✅ TEST USER CREATED SUCCESSFULLY');
        console.log('==========================================');
        console.log('Email:    test@example.com');
        console.log('Password: password123');
        console.log('==========================================');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error creating user:', error.message);
        if (error.errors) {
            // Show detailed mongoose validation errors if any
            Object.keys(error.errors).forEach(key => {
                console.error(`   - ${key}: ${error.errors[key].message}`);
            });
        }
        process.exit(1);
    }
};

createTestUser();