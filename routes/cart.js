const express = require('express');
const router = express.Router();
const Cart = require('../model/cartModel');
const Products = require('../model/ProductModel');
// Save Cart
router.post('/cart/add', async (req, res) => {
    const { userId, productId, quantity, selectedSize } = req.body;
    try {
        const product = await Products.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found', result: [] });
        }

        const existingCartItem = await Cart.findOne({ userId, productId, selectedSize });
        if (existingCartItem) {
            existingCartItem.quantity += quantity;
            await existingCartItem.save();
            return res.status(200).json({ message: 'Product quantity updated in cart', result: existingCartItem, code: 200, success: true, });
        } else {
            const newProductCart = new Cart({ userId, productId, quantity, selectedSize });
            await newProductCart.save();
            return res.status(200).json({ message: 'Product added to your Cart successfully', result: newProductCart, code: 200, success: true, });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' })
    }

})
// Cart List
router.get('/cart/get', async (req, res) => {
    try {
        const cartItems = await Cart.find().populate('productId').populate('userId');
        if (!cartItems || cartItems.length === 0) {
            return res.status(404).json({ message: 'No cart items found', result: [], success: false });
        }
        return res.status(200).json({ result: cartItems, code: 200, success: true });
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' })
    }
})

// Cart get user wise List
router.get('/cart/getById/:userId', async (req, res) => {
    try {
        const cartItems = await Cart.find({ userId: req.params.userId }).populate('productId');
        if (!cartItems || cartItems.length === 0) {
            return res.status(404).json({ message: 'No cart items found', result: [] });
        }
        return res.status(200).json({ result: cartItems, code: 200, success: true });
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' })
    }
})
// Update cart
router.put('/cart/update/:id', async (req, res) => {
    const { userId, productId, quantity, selectedSize } = req.body
    try {
        const cartId = await Cart.findById(req.params.id)
        if (!cartId) {
            return res.status(404).json({ message: 'Cart items not found', result: [] });
        }
        const existingCartItem = await Cart.findOne({ userId, productId, selectedSize });
        if (existingCartItem) {
            existingCartItem.quantity += quantity;
            await existingCartItem.save();
            await Cart.findByIdAndDelete(cartId) //same product with same size delete
            return res.status(200).json({ message: 'Product quantity updated in cart', result: existingCartItem, code: 200, success: true, });
        }
        else {
            const updateCart = await Cart.findByIdAndUpdate(req.params.id, {
                $set: { quantity, selectedSize }
            }, { new: true })
            return res.status(200).json({ message: 'Cart updated successfully', result: updateCart, code: 200, success: true, })
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' })
    }
})
// Delete Cart
router.post('/cart/delete', async (req, res) => {
    const { ids } = req.body
    try {
        const cartId = await Cart.find({ _id: { $in: ids } })
        if (!cartId) {
            return res.status(404).json({ message: 'Cart items not found', result: [] });
        }
        await Cart.deleteMany({ _id: { $in: ids } });
        return res.status(200).json({ code: 200, success: true, message: 'Cart Deleted successfully', })
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' })
    }
})

module.exports = router;