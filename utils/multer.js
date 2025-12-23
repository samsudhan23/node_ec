const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, 'assets/Products')
    },
    filename: (req, file, cb) => {
        // Use the actual filename from the uploaded file
        // Sanitize filename: replace spaces with underscores and remove special characters
        const originalName = file.originalname;
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\s+/g, '_');
        
        // Add timestamp and random number to make filename unique
        const timestamp = Date.now();
        const randomNum = crypto.randomBytes(4).toString('hex');
        const ext = path.extname(sanitizedName);
        const nameWithoutExt = path.basename(sanitizedName, ext);
        
        // Format: originalname_timestamp_random.ext
        const uniqueFileName = `${nameWithoutExt}_${timestamp}_${randomNum}${ext}`;
        cb(null, uniqueFileName);
    }
})
const upload = multer({ storage: storage })

module.exports = upload;