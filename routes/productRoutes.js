const express = require('express');
const router = express.Router();
const Products = require('../model/ProductModel')
const slugify = require('slugify');
const path = require('path');
const fs = require('fs');
const uploadFiles = require('../utils/multer');

// Helper function to delete uploaded files
const deleteUploadedFiles = (files) => {
    if (files) {
        if (files['images']) {
            files['images'].forEach(file => {
                const filePath = path.join(__dirname, '../assets/Products', file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }
        if (files['gallery']) {
            files['gallery'].forEach(file => {
                const filePath = path.join(__dirname, '../assets/Products', file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }
    }
};

/* create new product */
router.post('/products', uploadFiles.fields([
    { name: 'images', maxCount: 1 },
    { name: 'gallery', maxCount: 5 }
]), async (req, res) => {
    const { category, productName, gender, stock } = req.body;
    try {
        const isInvalidField = (value) => !value || value.trim() === '' || value == 0;
        // Check Category(Validation)
        if (isInvalidField(category)) {
            deleteUploadedFiles(req.files);
            return res.status(400).json({ message: 'Category is required' });
        }

        if (isInvalidField(gender)) {
            deleteUploadedFiles(req.files);
            return res.status(400).json({ message: 'Gender is required' });
        }
        // Set Unique Slug name
        // const baseSlug = slugify(productName, { lower: true });
        // const randomSuffix = Math.floor(Math.random() * 10000);
        // req.body.slug = `${baseSlug}-${randomSuffix}`;
        // Check Stock Value
        req.body.inStock = stock > 0;

        // Check Existing Products
        const existingProducts = await Products.findOne({ productName, category });
        if (existingProducts) {
            deleteUploadedFiles(req.files);
            return res.status(400).json({ message: 'Product already exists for this gender and category' })
        }
        if (req.files && req.files['images'] && req.files['images'][0]) {
            req.body.images = req.files['images'][0].filename;
        }
        if (req.files && req.files['gallery']) {
            req.body.gallery = req.files['gallery'].map(file => file.filename);
        }
        const newProduct = new Products(req.body)
        await newProduct.save();
        return res.status(200).json({ message: 'Product created successfully', result: newProduct, code: 200, success: true, });
    }
    catch (error) {
        deleteUploadedFiles(req.files);
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});

/* update product */
router.put('/updateProducts/:id', uploadFiles.fields([
    { name: 'images', maxCount: 1 },
    { name: 'gallery', maxCount: 5 }
]), async (req, res) => {
    const { productName, category, gender } = req.body;
    try {
        const products = await Products.findById(req.params.id);
        if (!products || products.length === 0) {
            deleteUploadedFiles(req.files)
            return res.status(404).json({ message: "Product doesn't exists", result: [] })
        }
        // Slug Duplicate Checking
        // req.body.slug = slugify(productName, { lower: true })
        const existingSlug = await Products.findOne({ productName, category })
        if (existingSlug && existingSlug._id.toString() !== req.params.id) {
            deleteUploadedFiles(req.files)
            return res.status(400).json({ message: "A product with the same name already exists in this category and gender.", result: [] })
        }
        if (req.files && req.files['images'] && req.files['images'][0]) {
            if (products.images) {
                const oldPath = path.join(__dirname, '../assets/Products', products.images);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
                req.body.images = req.files['images'][0].filename;
            }
        }
        if (req.files && req.files['gallery']) {
            // Get retained gallery images from frontend
            let existingGallery = req.body.existingGallery || [];
            if (!Array.isArray(existingGallery)) {
                existingGallery = [existingGallery]; // normalize
            }

            // Get new uploaded filenames
            const newGalleryFiles = req.files['gallery'].map(file => file.filename);
            req.body.gallery = [...existingGallery, ...newGalleryFiles];

            // 🔁 Delete only images that were removed (i.e., in DB but not in existingGallery)
            if (products.gallery && products.gallery.length > 0) {
                const removed = products.gallery.filter(
                    oldImg => !existingGallery.includes(oldImg)
                );
                removed.forEach(oldImage => {
                    const oldImagePath = path.join(__dirname, '../assets/Products', oldImage);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                });
            }
        } else if (req.body.existingGallery) {
            // No new files, only keep existing ones
            let existingGallery = req.body.existingGallery;
            if (!Array.isArray(existingGallery)) {
                existingGallery = [existingGallery];
            }

            // Delete removed ones
            const removed = products.gallery.filter(
                oldImg => !existingGallery.includes(oldImg)
            );
            removed.forEach(oldImage => {
                const oldImagePath = path.join(__dirname, '../assets/Products', oldImage);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            });

            req.body.gallery = existingGallery;
        } else {
            // No gallery files at all, so clear it
            req.body.gallery = [];
        }
        const updateProducts = await Products.findByIdAndUpdate(req.params.id, {
            $set: req.body
        }, { new: true }); //this returns the updated document

        return res.status(200).json({ result: updateProducts, code: 200, success: true, message: 'Product Updated successfully', })
    }
    catch (error) {
        // deleteUploadedFiles(req.files)
        res.status(500).json({ message: 'Server Error' });
    }
})
/** Delete Products */
router.post('/deleteProducts', async (req, res) => {
    const { ids } = req.body
    try {
        const products = await Products.find({ _id: { $in: ids } });
        if (!products || products.length === 0) {
            return res.status(404).json({ message: "Product doesn't exists", result: [], success: false })
        }
        await Products.deleteMany({ _id: { $in: ids } });
        for (let i = 0; i < products.length; i++) {
            if (products[i].images) {
                const oldPath = path.join(__dirname, '../assets/Products', products[i].images);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
                // req.body.images = req.files['images'][0].filename;
            }
            if (products[i].gallery && products[i].gallery.length > 0) {
                products[i].gallery.forEach(oldImage => {
                    const oldImagePath = path.join(__dirname, '../assets/Products', oldImage);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                });
            }
        }
        return res.status(200).json({ code: 200, success: true, message: 'Product Deleted successfully', })
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
})
/* get all products */
router.get('/getProducts', async (req, res) => {
    try {
        const products = await Products.find().populate('category').populate('gender')
        const hostURL = 'http://localhost:5000/assets/Products/';
        const updatedProducts = products.map(item => {
            return {
                ...item._doc,
                images: item.images ? hostURL + item.images : null,
                gallery: item.gallery ? item.gallery.map(img => hostURL + img) : []
            }
        })
        return res.status(200).json({ result: updatedProducts, code: 200, success: true, })
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
})

/* get single product */
// router.get('/products/:id', async (req, res) => {
//     try {
//         const products = await Products.findById(req.params.id);
//         if (!products) {
//             return res.status(404).json({ message: "Product doesn't exists" })
//         }
//         return res.status(200).json({ result: products, code: 200, success: true })
//     }
//     catch (error) {
//         res.status(500).json({ message: 'Server Error' });
//     }
// })

module.exports = router;