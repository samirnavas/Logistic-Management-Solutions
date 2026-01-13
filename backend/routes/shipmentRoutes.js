const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');

router.get('/', shipmentController.getShipments);
router.get('/:id', shipmentController.getShipment);
router.get('/tracking/:trackingNumber', shipmentController.getShipmentByTracking);
router.get('/status/:status', shipmentController.getShipmentsByStatus);
router.post('/', shipmentController.createShipment);
router.put('/:id', shipmentController.updateShipment);
router.delete('/:id', shipmentController.deleteShipment);

module.exports = router;
