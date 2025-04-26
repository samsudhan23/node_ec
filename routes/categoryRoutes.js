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
            return res.status(404).json({ message: 'Gender already exists', result: [] })
        }
        const newGender = new Gender({ genderName, slug })
        await newGender.save();
        return res.status(200).json({ message: 'Gender created succesfully', result: newGender, code: 200, success: true, })
    }
    catch (error) {
        res.status(500).res.json({ message: 'Server Error' })
    }
})

router.get('/genderList', async (req, res) => {
    try {
        const getList = await Gender.find();
        return res.status(200).json({ result: getList, code: 200, success: true, })
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
        return res.status(200).json({ message: 'Category created succesfully', result: newCategory, code: 200, success: true, })
    }
    catch (err) {
        res.status(500).json({ message: 'Server Error' })
    }
})

// Category List
router.get('/getCategories', async (req, res) => {
    try {
        const categoryList = await Category.find();
        return res.status(200).json({ code: 200, success: true, result: categoryList })
    }
    catch (err) {
        return res.status(500).json({ message: 'Server Error' })
    }
})

/* update product */
router.put('/updateCategory/:id', async (req, res) => {
    const { categoryName } = req.body;
    try {
        const updateCategory = await Category.findById(req.params.id);
        if (!updateCategory) {
            return res.status(404).json({ message: "Category doesn't exists", result: [] })
        }
        req.body.slug = slugify(categoryName, { lower: true })
        const updateCate = await Category.findByIdAndUpdate(req.params.id, {
            $set: req.body
        }, { new: true });

        return res.status(200).json({ result: updateCate, code: 200, success: true, message: 'Category Updated successfully', })
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
})

/** Delete Category */
router.delete('/deleteCategory/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Category doesn't exists", result: [] })
        }
        await Category.findByIdAndDelete(category);

        return res.status(200).json({ code: 200, success: true, message: 'Category Deleted successfully', })
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
})

module.exports = router;