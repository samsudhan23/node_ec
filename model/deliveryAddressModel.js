const mongoose = require('mongoose');

const deliveryAddressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: [true, 'User ID is required'],
    },
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
    },
    addressLine: {
        type: String,
        required: [true, 'Address line is required'],
    },
    landmark: {
        type: String,
    },
    city: {
        type: String,
        required: [true, 'City is required'],
    },
    state: {
        type: String,
        required: [true, 'State is required'],
    },
    postalCode: {
        type: String,
        required: [true, 'Postal code is required'],
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        default: 'India',
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
    },
    alternatePhoneNumber: {
        type: String,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

module.exports = mongoose.model('deliveryAddress', deliveryAddressSchema);

