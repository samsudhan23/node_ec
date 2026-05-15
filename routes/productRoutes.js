const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Products = require('../model/ProductModel')
const slugify = require('slugify');
const axios = require('axios');
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

// Helper function to extract filename from URL or path
const extractFileName = (imagePath) => {
    if (imagePath.includes('http')) {
        return imagePath.split('/').pop();
    }
    return imagePath.replace('http://localhost:5000/assets/Products/', '');
};

// Helper function to check if image is used by other products
const isImageUsedByOtherProducts = async (imageName, excludeId = null) => {
    const imageUrl = `http://localhost:5000/assets/Products/${imageName}`;
    const query = {
        $or: [
            { images: imageName },
            { images: imageUrl },
            { gallery: imageName },
            { gallery: imageUrl }
        ]
    };
    
    if (excludeId) {
        query._id = { $ne: excludeId };
    }
    
    const product = await Products.findOne(query);
    return !!product;
};

/* create new product */
router.post('/products', uploadFiles.fields([
    { name: 'images', maxCount: 1 },
    { name: 'gallery', maxCount: 5 }
]), async (req, res) => {
    const { category, productName, gender, totalStock } = req.body;
    try {
        const hostURL = 'http://localhost:5000/assets/Products/';
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
        req.body.inStock = totalStock > 0;

        // Check Existing Products
        const existingProducts = await Products.findOne({ productName, category });
        if (existingProducts) {
            deleteUploadedFiles(req.files);
            return res.status(400).json({ message: 'Product already exists for this gender and category' })
        }
        if (req.files && req.files['images'] && req.files['images'][0]) {
            req.body.images = `${hostURL + req.files['images'][0].filename}`;
        }
        if (req.files && req.files['gallery']) {
            req.body.gallery = req.files['gallery'].map(file => `${hostURL + file.filename}`);
        }
        req.body.sku = await generateSku();
        console.log('req.body: ', req.body);
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
        // Normalize discountPrice if it comes as an array (FormData duplicate key issue)
        if (Array.isArray(req.body.discountPrice)) {
            req.body.discountPrice = req.body.discountPrice.length > 0
                ? parseFloat(req.body.discountPrice[req.body.discountPrice.length - 1]) || 0
                : 0;
        } else if (req.body.discountPrice !== undefined && req.body.discountPrice !== null && req.body.discountPrice !== '') {
            req.body.discountPrice = parseFloat(req.body.discountPrice) || 0;
        }
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
        const hostURL = 'http://localhost:5000/assets/Products/';
        if (req.files && req.files['images'] && req.files['images'][0]) {
            if (products.images) {
                // Extract filename from URL if it's a full URL, otherwise use as is
                const oldImageName = extractFileName(products.images);
                // Check if image is used by other products before deleting
                const isUsed = await isImageUsedByOtherProducts(oldImageName, req.params.id);
                
                if (!isUsed) {
                    const oldPath = path.join(__dirname, '../assets/Products', oldImageName);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }
            }
            req.body.images = `${hostURL + req.files['images'][0].filename}`;
        }
        if (req.files && req.files['gallery']) {
            // Get retained gallery images from frontend
            let existingGallery = req.body.existingGallery || [];
            if (!Array.isArray(existingGallery)) {
                existingGallery = [existingGallery]; // normalize
            }

            // Get new uploaded filenames with hostURL
            const newGalleryFiles = req.files['gallery'].map(file => `${hostURL + file.filename}`);
            // Ensure existing gallery items have full URLs
            const existingGalleryWithURL = existingGallery.map(img => 
                img.startsWith('http') ? img : `${hostURL + img}`
            );
            req.body.gallery = [...existingGalleryWithURL, ...newGalleryFiles];

            // 🔁 Delete only images that were removed (i.e., in DB but not in existingGallery)
            if (products.gallery && products.gallery.length > 0) {
                // Extract filenames from products.gallery (might be URLs or filenames)
                const productGalleryFilenames = products.gallery.map(img => 
                    img.includes('http') ? img.split('/').pop() : img
                );
                const existingGalleryFilenames = existingGallery.map(img => 
                    img.includes('http') ? img.split('/').pop() : img
                );
                
                const removed = productGalleryFilenames.filter(
                    oldImg => !existingGalleryFilenames.includes(oldImg)
                );
                // Delete removed images only if not used by other products
                for (const oldImage of removed) {
                    const isUsed = await isImageUsedByOtherProducts(oldImage, req.params.id);
                    if (!isUsed) {
                        const oldImagePath = path.join(__dirname, '../assets/Products', oldImage);
                        if (fs.existsSync(oldImagePath)) {
                            fs.unlinkSync(oldImagePath);
                        }
                    }
                }
            }
        } else if (req.body.existingGallery) {
            // No new files, only keep existing ones
            let existingGallery = req.body.existingGallery;
            if (!Array.isArray(existingGallery)) {
                existingGallery = [existingGallery];
            }

            // Ensure existing gallery items have full URLs
            const existingGalleryWithURL = existingGallery.map(img => 
                img.startsWith('http') ? img : `${hostURL + img}`
            );

            // Delete removed ones
            if (products.gallery && products.gallery.length > 0) {
                const productGalleryFilenames = products.gallery.map(img => 
                    img.includes('http') ? img.split('/').pop() : img
                );
                const existingGalleryFilenames = existingGallery.map(img => 
                    img.includes('http') ? img.split('/').pop() : img
                );
                
                const removed = productGalleryFilenames.filter(
                    oldImg => !existingGalleryFilenames.includes(oldImg)
                );
                // Delete removed images only if not used by other products
                for (const oldImage of removed) {
                    const isUsed = await isImageUsedByOtherProducts(oldImage, req.params.id);
                    if (!isUsed) {
                        const oldImagePath = path.join(__dirname, '../assets/Products', oldImage);
                        if (fs.existsSync(oldImagePath)) {
                            fs.unlinkSync(oldImagePath);
                        }
                    }
                }
            }

            req.body.gallery = existingGalleryWithURL;
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
        console.log('error: ', error);
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
        
        // Helper function to check if image is used by other products (for delete route)
        const isImageUsedByOtherProductsForDelete = async (imageName, excludeIds) => {
            const imageUrl = `http://localhost:5000/assets/Products/${imageName}`;
            const product = await Products.findOne({
                _id: { $nin: excludeIds },
                $or: [
                    { images: imageName },
                    { images: imageUrl },
                    { gallery: imageName },
                    { gallery: imageUrl }
                ]
            });
            return !!product;
        };
        
        // Delete image files before deleting from database
        for (let i = 0; i < products.length; i++) {
            // Delete main image only if not used by other products
            if (products[i].images) {
                const imageName = extractFileName(products[i].images);
                const isUsed = await isImageUsedByOtherProductsForDelete(imageName, ids);
                
                if (!isUsed) {
                    const oldPath = path.join(__dirname, '../assets/Products', imageName);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }
            }
            
            // Delete gallery images only if not used by other products
            if (products[i].gallery && products[i].gallery.length > 0) {
                for (const oldImage of products[i].gallery) {
                    const galleryImageName = extractFileName(oldImage);
                    const isUsed = await isImageUsedByOtherProductsForDelete(galleryImageName, ids);
                    
                    if (!isUsed) {
                        const oldImagePath = path.join(__dirname, '../assets/Products', galleryImageName);
                        if (fs.existsSync(oldImagePath)) {
                            fs.unlinkSync(oldImagePath);
                        }
                    }
                }
            }
        }
        
        // Delete products from database after files are deleted
        await Products.deleteMany({ _id: { $in: ids } });
        return res.status(200).json({ code: 200, success: true, message: 'Product Deleted successfully', })
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
})
/* get all products */
router.get('/getProducts', async (req, res) => {
    try {
        const products = await Products.find().populate('category').populate('gender');
        // const hostURL = 'http://localhost:5000/assets/Products/';
        // Delete products with missing categories
        const withoutCategory = products.filter(item => item.category == null);
        if (withoutCategory.length > 0) {
            const idsToDelete = withoutCategory.map(item => item._id);

            // await Products.deleteMany({ _id: { $in: idsToDelete } });
            // for (let i = 0; i < withoutCategory.length; i++) {
            //     if (withoutCategory[i].images) {
            //         const oldPath = path.join(__dirname, '../assets/Products', withoutCategory[i].images);
            //         if (fs.existsSync(oldPath)) {
            //             fs.unlinkSync(oldPath);
            //         }
            //         // req.body.images = req.files['images'][0].filename;
            //     }
            //     if (withoutCategory[i].gallery && withoutCategory[i].gallery.length > 0) {
            //         withoutCategory[i].gallery.forEach(oldImage => {
            //             const oldImagePath = path.join(__dirname, '../assets/Products', oldImage);
            //             if (fs.existsSync(oldImagePath)) {
            //                 fs.unlinkSync(oldImagePath);
            //             }
            //         });
            //     }
            // }
            await Products.deleteMany({ _id: { $in: idsToDelete } });
        }
        // Reload cleaned product list
        const cleanProducts = await Products.find().populate('category').populate('gender');
        // const finalProducts = cleanProducts.map(item => {
        //     return {
        //         ...item._doc,
        //         images: item.images ? hostURL + item.images : null, //image name with url set
        //         gallery: item.gallery ? item.gallery.map(img => hostURL + img) : []
        //     }
        // });

        return res.status(200).json({ result: cleanProducts, code: 200, success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get ByID
router.get('/getByIDProducts/:id', async (req, res) => {
    const prodID = req.params.id
    try {
        const baseURL = `${req.protocol}://${req.get('host')}/assets/Products/`;
        const products = await Products.findById(prodID);
        console.log('products: ', products);
        if (products.images) {
            if (!products.images.startsWith('http')) {
                products.images = `${baseURL}${products.images}`;
            }
        }

        // ✅ Fix gallery array
        if (products.gallery && Array.isArray(products.gallery)) {
            products.gallery = products.gallery.map(img =>
                img.startsWith('http') ? img : `${baseURL}${img}`
            );
        }

        return res.status(200).json({ result: products, code: 200, success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.get('/colors', async (req, res) => {
    try {
        const response = await axios.get('https://csscolorsapi.com/api/colors');
        return res.status(200).json({ result: response.data.colors, code: 200, success: true })
    } catch (err) {
        return res.status(err.response?.status || 500).json({ message: err.message });
    }
});
//For Generate SKU
async function generateSku(prefix = "SKU") {
    const hash = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `${prefix}-${hash}`;
}

module.exports = router;