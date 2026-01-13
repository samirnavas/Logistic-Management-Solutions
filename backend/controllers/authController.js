const User = require('../models/User');

// ============================================
// Register new user
// ============================================
exports.register = async (req, res) => {
    try {
        console.log('Register request received with body:', req.body);
        const { fullName, email, phone, country, password, role } = req.body;

        // Validate required fields
        if (!fullName || !email || !password) {
            return res.status(400).json({
                message: 'Missing required fields',
                required: ['fullName', 'email', 'password']
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Create user (password is auto-hashed in pre-save hook)
        // customerCode is auto-generated for clients in pre-save hook
        const newUser = new User({
            fullName,
            email,
            phone: phone || '',
            password, // Will be hashed by pre-save hook
            role: role || 'client',
            savedAddresses: country ? [{
                label: 'Default',
                addressLine: '',
                city: '',
                country,
                zipCode: '',
                isDefault: true,
            }] : [],
        });

        const savedUser = await newUser.save();

        res.status(201).json({
            message: 'User registered successfully',
            user: savedUser, // toJSON transform removes password
        });

    } catch (error) {
        console.error('Registration Error:', error);

        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                message: 'Validation error',
                errors: messages
            });
        }

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'User already exists with this email'
            });
        }

        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
};

// ============================================
// Login user
// ============================================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user with password included
        const user = await User.findByEmailWithPassword(email);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        // Compare password using instance method
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Update last login time
        user.lastLoginAt = new Date();
        await user.save();

        res.status(200).json({
            message: 'Login successful',
            user: user.toJSON(), // toJSON transform removes password
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
};

// ============================================
// Get user by ID
// ============================================
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get User Error:', error);
        res.status(500).json({ message: 'Failed to fetch user', error: error.message });
    }
};

// ============================================
// Get first user (for testing)
// ============================================
exports.getFirstUser = async (req, res) => {
    try {
        const user = await User.findOne();
        if (!user) {
            return res.status(404).json({ message: 'No users found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get First User Error:', error);
        res.status(500).json({ message: 'Failed to fetch user', error: error.message });
    }
};

// ============================================
// Change password
// ============================================
exports.changePassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'New password must be at least 6 characters'
            });
        }

        // Find user with password
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({ message: 'Failed to change password', error: error.message });
    }
};

// ============================================
// Verify email (placeholder for email verification)
// ============================================
exports.verifyEmail = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndUpdate(
            userId,
            { emailVerified: true },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Email verified successfully', user });

    } catch (error) {
        console.error('Verify Email Error:', error);
        res.status(500).json({ message: 'Failed to verify email', error: error.message });
    }
};
