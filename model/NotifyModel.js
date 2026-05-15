// models/Notify.js
const mongoose = require('mongoose');

const notifySchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    selectedSize: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notify', notifySchema)