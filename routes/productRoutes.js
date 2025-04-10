const express = require('express');
const router = express.Router();
const Products = require('../model/ProductModel')
const slugify = require('slugify');


router.post('/products', async (req, res) => {
    const { category, productName } = req.body;
    try {
        // Check Category(Validation)
        if (!category || category.trim() === '') {
            return res.status(400).json({ message: 'Category is required' });
        }
        // Set Uniq Slag name
        req.body.slug = slugify(productName, { lower: true });
        const slug = req.body.slug
        // Check Stock Value
        if (req.body.stock <= 0) {
            req.body.inStock = false;
        }
        // Check Existing Products
        const existingProducts = await Products.findOne({ productName, category, slug });
        if (existingProducts) {
            return res.status(400).json({ message: 'Product already exists' })
        }
        const newProduct = new Products(req.body)
        await newProduct.save();
        res.status(200).json({ message: 'Product created succesfully', result: newProduct })
    }
    catch (error) {
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages });
        }
        res.status(500).json({ message: 'Server Error' })
    }
})

module.exports = router;