const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    otpExpiry: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 //5 minutes
    }
});

module.exports = mongoose.model('Otp', OtpSchema)