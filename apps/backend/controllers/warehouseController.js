const Warehouse = require('../models/Warehouse');

// @desc    Get all warehouses (Public/Client)
// @route   GET /api/warehouses
// @access  Public
exports.getWarehouses = async (req, res) => {
    try {
        const warehouses = await Warehouse.find({ isActive: true }).sort({ name: 1 });
        res.status(200).json({
            success: true,
            count: warehouses.length,
            data: warehouses
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
};

// @desc    Get all warehouses (Admin - includes inactive)
// @route   GET /api/warehouses/admin
// @access  Private/Admin
exports.getAllWarehousesAdmin = async (req, res) => {
    try {
        const warehouses = await Warehouse.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: warehouses.length,
            data: warehouses
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
};

// @desc    Get single warehouse
// @route   GET /api/warehouses/:id
// @access  Public
exports.getWarehouse = async (req, res) => {
    try {
        const warehouse = await Warehouse.findById(req.params.id);

        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: 'Warehouse not found'
            });
        }

        res.status(200).json({
            success: true,
            data: warehouse
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
};

// @desc    Create new warehouse
// @route   POST /api/warehouses
// @access  Private/Admin
exports.createWarehouse = async (req, res) => {
    try {
        console.log('Creating warehouse with body:', req.body);
        const warehouse = await Warehouse.create(req.body);

        res.status(201).json({
            success: true,
            data: warehouse
        });
    } catch (err) {
        console.error('Error creating warehouse:', err);
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Warehouse with this name or code already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
};

// @desc    Update warehouse
// @route   PUT /api/warehouses/:id
// @access  Private/Admin
exports.updateWarehouse = async (req, res) => {
    try {
        const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: 'Warehouse not found'
            });
        }

        res.status(200).json({
            success: true,
            data: warehouse
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
};

// @desc    Delete warehouse
// @route   DELETE /api/warehouses/:id
// @access  Private/Admin
exports.deleteWarehouse = async (req, res) => {
    try {
        const warehouse = await Warehouse.findById(req.params.id);

        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: 'Warehouse not found'
            });
        }

        await warehouse.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
};
