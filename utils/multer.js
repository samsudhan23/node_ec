const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, 'assets/Products')
    },
    filename: (req, file, cb) => {
        // Use the actual filename from the uploaded file
        // Sanitize filename: replace spaces with underscores and remove special characters
        const originalName = file.originalname;
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\s+/g, '_');
        cb(null, sanitizedName);
    }
})
const upload = multer({ storage: storage })

module.exports = upload;