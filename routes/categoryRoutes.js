const express = require('express');
const router = express.Router();
const slugify = require('slugify');
const Category = require('../model/CategoryModel');
const Gender = require('../model/genterModel');
const Products = require('../model/ProductModel')

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
        const genderWithCategories = await Promise.all(
            getList.map(async (g) => {
                const categoryIds = await Products.distinct("category", { gender: g._id });
                const categories = await Category.find({ _id: { $in: categoryIds } });
                return {
                    ...g._doc, //is the raw object data inside that document
                    categories
                }
            })
        )
        return res.status(200).json({ result: getList, navData: genderWithCategories, code: 200, success: true, })
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
        if (!updateCategory || updateCategory.length === 0) {
            return res.status(404).json({ message: "Category doesn't exists", result: [] })
        }
        // Check Existing Products
        const existing = await Category.findOne({ categoryName, _id: { $ne: req.params.id } });
        if (existing) {
            return res.status(400).json({ message: 'Category already exists' })
        }
        req.body.slug = slugify(categoryName, { lower: true })
        const updateCate = await Category.findByIdAndUpdate(req.params.id, {
            $set: req.body
        }, { new: true });

        return res.status(200).json({ result: updateCate, code: 200, success: true, message: 'Category Updated successfully', })
    }
    catch (error) {
        res.status(500).json({ message: error, code: 500, success: false, });
    }
})

/** Delete Category */
router.post('/deleteCategory', async (req, res) => {
    const { ids } = req.body
    try {
        const category = await Category.find({ _id: { $in: ids } });
        if (!category || category.length === 0) {
            return res.status(404).json({ message: "Category doesn't exists", result: [] })
        }
        await Category.deleteMany({ _id: { $in: ids } });

        return res.status(200).json({ code: 200, success: true, message: 'Category Deleted successfully', })
    }
    catch (error) {
        return res.status(500).json({ message: 'Server Error' });
    }
})

module.exports = router;