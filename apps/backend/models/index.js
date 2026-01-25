/**
 * Models Index
 * 
 * Central export point for all Mongoose models.
 * Import models from this file to ensure consistency.
 */

const User = require('./User');
const Quotation = require('./Quotation');
const Shipment = require('./Shipment');
const Notification = require('./Notification');

module.exports = {
    User,
    Quotation,
    Shipment,
    Notification,
};

