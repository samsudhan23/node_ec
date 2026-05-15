const express = require('express');
const router = express.Router();
const wishLists = require('../model/wishlistModel');
const Products = require('../model/ProductModel');
const { resolveProductImageUrl } = require('../utils/cloudinaryImage');

// Save wishlist
router.post('/wishList/post', async (req, res) => {
    const { userId, productId } = req.body;
    try {
        const existing = await wishLists.findOne({ userId, productId })
        if (existing) {
            return res.status(400).json({ message: 'Product already exists for this user', result: [], success: false, });
        }
        const newWishList = new wishLists({ userId, productId });
        await Products.findByIdAndUpdate(productId, { isWishlisted: true });
        await newWishList.save();
        return res.status(200).json({ message: 'Product Added successfully', result: newWishList, code: 200, success: true, });
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' })
    }
})
// update wishlist
router.put('/wishList/update/:id', async (req, res) => {
    const { userId, productId } = req.body;
    try {
        const existing = await wishLists.findOne({ userId, productId })
        if (existing) {
            return res.status(400).json({ message: 'Product already exists for this user', result: [], success: false, });
        }
        const newWishList = await wishLists.findById(req.params.id);
        if (!newWishList || newWishList.length === 0) {
            return res.status(404).json({ message: "Product doesn't exits", result: [] })
        }
        const editList = await wishLists.findByIdAndUpdate(req.params.id, {
            $set: req.body
        }, { new: true });

        return res.status(200).json({ message: 'Product Updated successfully', result: editList, code: 200, success: true, });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server Error' })
    }
})
// Get WishList (with optional userId filter)
router.get('/wishList/get', async (req, res) => {
    try {
        const { userId } = req.query;
        // Build query - filter by userId if provided
        let query = {};
        if (userId) {
            query.userId = userId;
        }
        
        const getAll = await wishLists.find(query).populate('productId').populate('userId');
        const unwantedUser = getAll.filter(item => item.userId == null || item.productId == null)
        if (unwantedUser && unwantedUser.length > 0) {
            const idsToDelete = unwantedUser.map(item => item._id)
            await wishLists.deleteMany({ _id: { $in: idsToDelete } });
        }
        
        // Re-fetch after cleanup
        const cleanWishlist = await wishLists.find(query).populate('productId').populate('userId');
        const wishlistWithImagePaths = cleanWishlist.map(item => {
            const product = item.productId;
            if (product) {
                // ✅ Fix main image
                if (product.images) {
                    product.images = resolveProductImageUrl(product.images, req);
                }

                if (product.gallery && Array.isArray(product.gallery)) {
                    product.gallery = product.gallery.map((img) => resolveProductImageUrl(img, req));
                }
            }
            return item;
        })
        return res.status(200).json({ result: wishlistWithImagePaths, code: 200, success: true, })
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' })
    }
})

// Remove wishlist
router.post('/wishList/delete', async (req, res) => {
    const { ids } = req.body
    try {
        const wishlistId = await wishLists.find({ _id: { $in: ids } });
        if (!wishlistId) {
            return res.status(404).json({ message: "Product doesn't exists", result: [] })
        }
        await wishLists.deleteMany({ _id: { $in: ids } });
        return res.status(200).json({ code: 200, success: true, message: 'Product Removed successfully', })
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' })
    }
})
module.exports = router;