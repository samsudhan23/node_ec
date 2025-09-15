const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema({
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'Category is required'] },
    productVariantName: { type: String, requied: [true, 'productVariant Name is required'] },
    productVariantDescription: { type: String },
})

module.exports = mongoose.model('ProductVariant', productVariantSchema)