const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
    },
    categoryDescription: {
        type: String,
    },
    slug: { type: String, required: true, unique: true },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);