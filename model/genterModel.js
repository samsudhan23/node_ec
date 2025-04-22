const mongoose = require('mongoose');

const genderSchema = new mongoose.Schema({
    genderName: {
        type: String,
        required: true
    },
    slug: {
        type: String, required: true, unique: true
    },
}, { timestamps: true })

module.exports = mongoose.model('Gender', genderSchema)