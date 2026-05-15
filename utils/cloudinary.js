const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

module.exports = cloudinary;
