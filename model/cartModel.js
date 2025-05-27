const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products',
        required: true,
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1,
        required: true,
    },
    selectedSize: {
        type: String,
        required: true,
    },
    selectedColor: {
        type: String,
        required: true,
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('carts', cartItemSchema)