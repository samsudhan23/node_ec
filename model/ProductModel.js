const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'Category is required'] },
    gender: { type: mongoose.Schema.Types.ObjectId, ref: 'Gender', required: [true, 'Gender is required'] },
    productName: {
        type: String,
        required: true,
    },
    sku: { type: String, required: [true, 'Sku is required'] },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'warehouse', required: [true, 'Warehouse is required'] },
    productMaterial: { type: String, requied: [true, 'Material is required'] },
    careInstruction: { type: String },
    productDescription: String,
    images: { type: String, required: true },
    price: {
        type: Number,
        required: true,
    },
    discountPrice: Number,
    // slug: { type: String, required: true },
    gallery: {
        type: [String],
        required: [true, 'Gallery is required'],
        validate: {
            validator: function (value) {
                return Array.isArray(value) && value.length > 0;
            },
            message: 'At least one image in the gallery is required'
        }
    },
    brand: String,
    sizeStock: [
        {
            size: {
                type: String,
                required: true,
                // enum: ['S', 'M', 'L', 'XL']
            },
            stock: {
                type: Number,
                required: true,
                min: 0
            }
        }
    ],
    colors: {
        type: [String],
        // required: [true, 'Colors are required'],
        // validate: {
        //     validator: function (value) {
        //         return value.length > 0;
        //     },
        //     message: 'At least one color is required'
        // }
    },
    tags: [String],
    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },
    totalStock: { type: Number, default: 0, required: true, },
    inStock: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false }, //Highlight for Home Page
},{ timestamps: true });
productSchema.index(
    { productName: 1, category: 1, gender: 1, sku: 1 },
    { unique: true }
);

module.exports = mongoose.model('products', productSchema)