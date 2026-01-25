const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const checkUsers = async () => {
    await connectDB();

    try {
        const users = await User.find({});
        console.log('\n--- REGISTERED USERS ---');
        if (users.length === 0) {
            console.log('No users found.');
        } else {
            users.forEach(user => {
                console.log(`
ID: ${user._id}
Name: ${user.fullName}
Email: ${user.email}
Phone: ${user.phone}
Customer Code: ${user.customerCode}
-------------------------`);
            });
        }
    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        mongoose.disconnect();
    }
};

checkUsers();
