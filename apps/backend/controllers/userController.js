const User = require('../models/User');
const Shipment = require('../models/Shipment');
const Quotation = require('../models/Quotation');
const mongoose = require('mongoose');

// ============================================
// Get User Dashboard Stats
// ============================================
exports.getDashboardStats = async (req, res) => {
    try {
        const { userId } = req.params;





        // 1. Requests - Count of quotations with status 'request_sent'
        const requests = await Quotation.countDocuments({
            clientId: userId,
            status: 'request_sent'
        });

        // 2. Shipped - Status 'In Transit'
        const shipped = await Shipment.countDocuments({
            clientId: userId,
            status: { $regex: 'Transit', $options: 'i' } // Case insensitive match for 'In Transit'
        });

        // 3. Delivered - Status 'Delivered'
        const delivered = await Shipment.countDocuments({
            clientId: userId,
            status: 'Delivered'
        });

        // 4. Cleared - Status 'Customs Cleared'
        const cleared = await Shipment.countDocuments({
            clientId: userId,
            status: 'Customs Cleared'
        });

        // 5. Dispatch - Status 'Out for Delivery' or 'Picked Up'
        const dispatch = await Shipment.countDocuments({
            clientId: userId,
            status: { $in: ['Out for Delivery', 'Picked Up', 'Arrived at Hub'] }
        });

        // 6. Waiting - Status 'Processing' or 'Customs'
        const waiting = await Shipment.countDocuments({
            clientId: userId,
            status: { $in: ['Processing', 'Customs', 'Pending'] }
        });

        res.json({
            requests,
            shipped,
            delivered,
            cleared,
            dispatch,
            waiting
        });
    } catch (error) {
        console.error('Get Dashboard Stats Error:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard stats', error: error.message });
    }
};

// ============================================
// Get user's saved addresses
// ============================================
exports.getAddresses = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select('savedAddresses');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            addresses: user.savedAddresses,
            defaultAddress: user.getDefaultAddress(),
        });
    } catch (error) {
        console.error('Get Addresses Error:', error);
        res.status(500).json({ message: 'Failed to fetch addresses', error: error.message });
    }
};

// ============================================
// Add a new address
// ============================================
exports.addAddress = async (req, res) => {
    try {
        const { userId } = req.params;
        const { setAsDefault = false, ...addressData } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Validate required fields
        if (!addressData.label || !addressData.addressLine || !addressData.city || !addressData.country || !addressData.zipCode) {
            return res.status(400).json({
                message: 'Missing required fields',
                required: ['label', 'addressLine', 'city', 'country', 'zipCode']
            });
        }

        await user.addAddress(addressData, setAsDefault);

        res.status(201).json({
            message: 'Address added successfully',
            addresses: user.savedAddresses,
            defaultAddress: user.getDefaultAddress(),
        });
    } catch (error) {
        console.error('Add Address Error:', error);
        res.status(400).json({ message: 'Failed to add address', error: error.message });
    }
};

// ============================================
// Update an address
// ============================================
exports.updateAddress = async (req, res) => {
    try {
        const { userId, addressId } = req.params;
        const updateData = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.updateAddress(addressId, updateData);

        res.json({
            message: 'Address updated successfully',
            addresses: user.savedAddresses,
            defaultAddress: user.getDefaultAddress(),
        });
    } catch (error) {
        console.error('Update Address Error:', error);
        res.status(400).json({ message: 'Failed to update address', error: error.message });
    }
};

// ============================================
// Delete an address
// ============================================
exports.deleteAddress = async (req, res) => {
    try {
        const { userId, addressId } = req.params;
        console.log(`[DELETE] Request to delete address ${addressId} for user ${userId}`);

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(addressId)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        // 1. Perform the pull operation atomicallly
        const user = await User.findByIdAndUpdate(
            userId,
            {
                $pull: { savedAddresses: { _id: new mongoose.Types.ObjectId(addressId) } }
            },
            { new: true }
        );

        if (!user) {
            console.log('[DELETE] User not found');
            return res.status(404).json({ message: 'User not found' });
        }

        // 2. Optional: Ensure default address logic (Wrapped in its own try-catch to prevent 500 on entire request)
        try {
            if (user.savedAddresses && user.savedAddresses.length > 0) {
                const hasDefault = user.savedAddresses.some(addr => addr.isDefault);
                if (!hasDefault) {
                    // If no default exists, make the first one default
                    user.savedAddresses[0].isDefault = true;
                    await user.save({ validateBeforeSave: false }); // Skip validation for this fixup
                }
            }
        } catch (innerError) {
            console.warn('[DELETE] Warning: Failed to reassign default address, but deletion succeeded.', innerError);
        }

        console.log('[DELETE] Success');
        res.json({
            message: 'Address deleted successfully',
            addresses: user.savedAddresses,
            defaultAddress: user.savedAddresses.find(a => a.isDefault) || null,
        });

    } catch (error) {
        console.error('[DELETE] Critical Error:', error);
        res.status(500).json({
            message: 'Failed to delete address',
            error: error.message,
            stack: error.stack
        });
    }
};

// ============================================
// Set an address as default
// ============================================
exports.setDefaultAddress = async (req, res) => {
    try {
        const { userId, addressId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.setDefaultAddress(addressId);

        res.json({
            message: 'Default address updated',
            addresses: user.savedAddresses,
            defaultAddress: user.getDefaultAddress(),
        });
    } catch (error) {
        console.error('Set Default Address Error:', error);
        res.status(400).json({ message: 'Failed to update default', error: error.message });
    }
};

// ============================================
// Get user profile
// ============================================
exports.getProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
    }
};

// ============================================
// Update user profile
// ============================================
exports.updateProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;

        // Disallow updating sensitive fields
        const disallowedFields = ['password', 'email', 'role', 'customerCode'];
        disallowedFields.forEach(field => delete updates[field]);

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Profile updated successfully',
            user,
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(400).json({ message: 'Failed to update profile', error: error.message });
    }
};

// ============================================
// Update avatar
// ============================================
exports.updateAvatar = async (req, res) => {
    try {
        const { userId } = req.params;
        const { avatarUrl } = req.body;

        if (!avatarUrl) {
            return res.status(400).json({ message: 'Avatar URL is required' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { avatarUrl },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Avatar updated successfully',
            user,
        });
    } catch (error) {
        console.error('Update Avatar Error:', error);
        res.status(400).json({ message: 'Failed to update avatar', error: error.message });
    }
};

// ============================================
// Get all users (Admin only)
// ============================================
exports.getAllUsers = async (req, res) => {
    try {
        const { role, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (role) {
            query.role = role;
        }

        const [users, total] = await Promise.all([
            User.find(query)
                // .select('-savedAddresses') // Included addresses for dashboard display
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(query)
        ]);

        res.json({
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + users.length < total,
            }
        });
    } catch (error) {
        console.error('Get All Users Error:', error);
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
};

// ============================================
// Update user role (Admin only)
// ============================================
exports.updateRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!['client app', 'manager', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'User role updated',
            user,
        });
    } catch (error) {
        console.error('Update Role Error:', error);
        res.status(400).json({ message: 'Failed to update role', error: error.message });
    }
};
