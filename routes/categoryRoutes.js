const express = require('express');
const router = express.Router();
const slugify = require('slugify');
const Category = require('../model/CategoryModel');


router.post('/categories', async (req, res) => {
    const { categoryName, categoryDescription } = req.body;
    try {
        // Set Uniq Slag name
        const slug = slugify(categoryName, { lower: true });
        
        // Check Existing Products
        const existingSlug = await Category.findOne({ slug });
        if (existingSlug) {
            return res.status(400).json({ message: 'Category already exists' })
        }
        const newCategory = new Category({ categoryName, slug, categoryDescription })
        await newCategory.save();
        res.status(200).json({ message: 'Category created succesfully', result: newCategory })
    }
    catch (err) {
        res.status(500).json({ message: 'Server Error' })
    }


})

module.exports = router;