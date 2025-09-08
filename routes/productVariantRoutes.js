const express = require('express');
const router = express.Router();
const slugify = require('slugify');
const productVariant = require('../model/productVariantModel');

router.get('/getProductVariant', async (req, res) => {
    try {
        const getVariant = await productVariant.find();
        return res.status(200).json({ result: getVariant, code: 200, status: true })
    }
    catch (err) {
        return res.status(500).json({ message: err, status: false, code: 500 })
    }
})

router.post('/saveProductVariant', async (req, res) => {
    try {
        const { category, productVariantName, productVariantDescription } = req.body;
        // Set Uniq Slag name
        const slug = slugify(productVariantName, { lower: true });
        // Check Existing Products
        const existingSlug = await productVariant.findOne({ slug });
        if (existingSlug) {
            return res.status(400).json({ message: 'Product Varaint already exists' })
        }
        const saveVariant = new productVariant({ category, productVariantName, productVariantDescription });
        await saveVariant.save();
        return res.status(200).json({ message: 'Product Varaint save succesfully', result: saveVariant, code: 200, status: true })
    }
    catch (err) {
        return res.status(500).json({ message: err, status: false, code: 500 })
    }
})

router.put('/editProductVariant/:id', async (req, res) => {
    const { productVariantName } = req.body;
    try {
        const updateVariant = await productVariant.findById(req.params.id)
        if (!updateVariant || updateVariant.length === 0) {
            return res.status(404).json({ message: "Product Variant doesn't exists", code: 404, status: false, result: [] })
        }
        req.body.slug = slugify(productVariantName, { lower: true });
        const updateVar = await productVariant.findByIdAndUpdate(req.params.id, {
            $set: req.body,
        }, { new: true });
        return res.status(200).json({ result: updateVar, code: 200, success: true, message: 'Product Variant Updated successfully', })
    }
    catch (err) {
        return res.status(500).json({ message: err, status: false, code: 500 })
    }
});

router.post('/deleteProductVariant/', async (req, res) => {
    const { ids } = req.body;
    try {
        const delVariant = await productVariant.findById({ _id: { $in: ids } });
        if (!delVariant || delVariant.length === 0) {
            return res.status(404).json({ message: "Product Variant doesn't exists", code: 404, status: false, result: [] })
        }
        await productVariant.deleteMany({ _id: { $in: ids } })
        return res.status(200).json({ code: 200, success: true, message: 'Product Variant Deleted successfully', })

    }
    catch (err) {
        return res.status(500).json({ message: err, status: false, code: 500 })
    }
})

module.exports = router;