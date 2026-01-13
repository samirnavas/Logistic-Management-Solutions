const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Helper to generate a random customer code
const generateCustomerCode = () => {
    return 'CUST-' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

exports.register = async (req, res) => {
    try {
        const { fullName, email, phone, country, password } = req.body;

        // Check availability
        const existingUser = await User.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email or phone.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate customer code & retry if duplicate (simple collision check)
        let customerCode = generateCustomerCode();
        let codeExists = await User.findOne({ customerCode });
        while (codeExists) {
            customerCode = generateCustomerCode();
            codeExists = await User.findOne({ customerCode });
        }

        // Create user
        const newUser = new User({
            fullName,
            email,
            phone,
            country,
            password: hashedPassword,
            customerCode
        });

        const savedUser = await newUser.save();

        // Return user data (excluding password ideally, but using schema transformation handles _id/id)
        // We explicitly omit password from the response here for safety, though Mongoose toJSON usually keeps it unless configured otherwise
        const userResponse = savedUser.toObject();
        delete userResponse.password;

        res.status(201).json({
            message: 'User registered successfully',
            user: userResponse
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Return success
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({
            message: 'Login successful',
            user: userResponse
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
};
