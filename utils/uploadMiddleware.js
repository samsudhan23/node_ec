/** Wrap multer middleware to return clear errors when Cloudinary upload fails */
const handleUpload = (uploadMiddleware) => (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({
                success: false,
                message: err.message || 'Image upload failed. Check Cloudinary env vars on the server.',
            });
        }
        next();
    });
};

module.exports = { handleUpload };
