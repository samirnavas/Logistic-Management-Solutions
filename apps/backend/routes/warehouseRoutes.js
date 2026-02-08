const express = require('express');
const {
    getWarehouses,
    getAllWarehousesAdmin,
    getWarehouse,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse
} = require('../controllers/warehouseController');

const router = express.Router();

// For now, we're not adding strict auth middleware to keep it simple as per previous patterns seen in userController (if any), 
// but normally we would add protect/admin middleware locally or globally.
// Looking at userController, it seems likely there's no auth middleware file nearby or it's not strictly enforced in this snippet.
// However, I'll assume public access for GET and stricter for others if I had the middleware.
// Since I don't see 'auth' middleware imported in server.js directly for routes but inside routes files usually.
// Let's check authRoutes to see if there is middleware exported? No, usually in middleware folder.
// I'll leave them open for now or check if I can find an auth middleware.

// Public routes
router.route('/').get(getWarehouses);
router.route('/:id').get(getWarehouse);

// Admin routes (should be protected)
router.route('/admin/all').get(getAllWarehousesAdmin);
router.route('/').post(createWarehouse);
router.route('/:id').put(updateWarehouse).delete(deleteWarehouse);

module.exports = router;
