const express = require('express');
const router = express.Router();
const slugify = require('slugify');
const Category = require('../model/CategoryModel');
const Gender = require('../model/genterModel');

// Gender API
router.post('/gender', async (req, res) => {
    const { genderName } = req.body;
    try {
        const slug = slugify(genderName, { lower: true });
        const uniqName = await Gender.findOne({ slug })
        if (uniqName) {
            return res.status(404).json({ message: 'Gender already exists' })
        }
        const newGender = new Gender({ genderName, slug })
        await newGender.save();
        return res.status(200).json({ message: 'Gender created succesfully', result: newGender })
    }
    catch (error) {
        res.status(500).res.json({ message: 'Server Error' })
    }
})

router.get('/genderList', async (req, res) => {
    try {
        const getList = await Gender.find();
        return res.status(200).json({ result: getList })
    }
    catch (error) {
        res.status(500).res.json({ message: 'Server Error' })
    }
})

// Category API
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
        return res.status(200).json({ message: 'Category created succesfully', result: newCategory })
    }
    catch (err) {
        res.status(500).json({ message: 'Server Error' })
    }


})

module.exports = router;