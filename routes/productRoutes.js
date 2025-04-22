const express = require('express');
const router = express.Router();
const Products = require('../model/ProductModel')
const slugify = require('slugify');

/* create new product */
router.post('/products', async (req, res) => {
    const { category, productName, gender, stock } = req.body;
    try {
        // Check Category(Validation)
        if (!category || category.trim() === '') {
            return res.status(400).json({ message: 'Category is required' });
        }
        // Set Unique Slug name
        const baseSlug = slugify(productName, { lower: true });
        const randomSuffix = Math.floor(Math.random() * 10000);
        req.body.slug = `${baseSlug}-${randomSuffix}`;
        // Check Stock Value
        req.body.inStock = stock > 0; // shorter way

        // Check Existing Products
        const existingProducts = await Products.findOne({ productName, category, gender });
        if (existingProducts) {
            return res.status(400).json({ message: 'Product already exists for this gender and category' })
        }
        const newProduct = new Products(req.body)
        await newProduct.save();
        return res.status(200).json({ message: 'Product created successfully', result: newProduct });
    }
    catch (error) {
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});

/* update product */
router.put('/updateProducts/:id', async (req, res) => {
    const { productName } = req.body;
    try {
        const products = await Products.findById(req.params.id);
        if (!products) {
            return res.status(404).json({ message: "Product doesn't exists" })
        }
        req.body.slug = slugify(productName, { lower: true })
        const updateProducts = await Products.findByIdAndUpdate(req.params.id, {
            $set: req.body
        });

        return res.status(200).json({ result: updateProducts, code: 200, success: true, message: 'Product Updated successfully', })
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
})
/** Delete Products */
router.delete('/deleteProducts/:id', async (req, res) => {
    try {
        const products = await Products.findById(req.params.id);
        if (!products) {
            return res.status(404).json({ message: "Product doesn't exists" })
        }
        await Products.findByIdAndDelete(req.params.id);

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
        return res.status(200).json({ result: products, code: 200, success: true })
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
})

/* get single product */
router.get('/products/:id', async (req, res) => {
    try {
        const products = await Products.findById(req.params.id);
        if (!products) {
            return res.status(404).json({ message: "Product doesn't exists" })
        }
        return res.status(200).json({ result: products, code: 200, success: true })
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
})

module.exports = router;