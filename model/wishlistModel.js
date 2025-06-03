const mongoose = require('mongoose');

const wishListSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products',
        required: true
    }

}, { timestamps: true });
wishListSchema.index({
    userId: 1, productId: 1
}, { unique: true })

module.exports = mongoose.model('wishlists', wishListSchema)