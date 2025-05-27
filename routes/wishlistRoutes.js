const express = require('express');
const router = express.Router();
const wishLists = require('../model/wishlistModel');

// Save wishlist
router.post('/wishList/post', async (req, res) => {
    const { userId, productId } = req.body;
    try {
        const newWishList = new wishLists({ userId, productId });
        await newWishList.save();
        return res.status(200).json({ message: 'Product Added successfully', result: newWishList, code: 200, success: true, });
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' })
    }
})
// Get WishList
router.get('/wishList/get', async (req, res) => {
    try {
        const getAll = await wishLists.find();
        return res.status(200).json({ result: getAll, code: 200, success: true, })
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' })
    }
})

// Remove wishlist
router.delete('/wishList/delete/:id', async (req, res) => {
    try {
        const wishlistId = await wishLists.findById(req.params.id);
        if (!wishlistId) {
            return res.status(404).json({ message: "Product doesn't exists", result: [] })
        }
        await wishLists.findByIdAndDelete(req.params.id);
        return res.status(200).json({ code: 200, success: true, message: 'Product Removed successfully', })
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' })
    }
})