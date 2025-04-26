const express = require('express');
const router = express.Router();
const Cart = require('../model/cartModel');
const Products = require('../model/ProductModel');
// Save Cart
router.post('/cart/add', async (req, res) => {
    const { userId, productId, quantity, selectedSize, selectedColor } = req.body;
    try {
        const product = await Products.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found', result: [] });
        }

        const existingCartItem = await Cart.findOne({ userId, productId, selectedSize, selectedColor });
        if (existingCartItem) {
            existingCartItem.quantity += quantity;
            await existingCartItem.save();
            return res.status(200).json({ message: 'Product quantity updated in cart', result: existingCartItem, code: 200, success: true, });
        } else {

            const newProductCart = new Cart({ userId, productId, quantity, selectedSize, selectedColor });
            await newProductCart.save();
            return res.status(200).json({ message: 'Product added to your Cart successfully', result: newProductCart, code: 200, success: true, });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' })
    }

})
// Cart List
router.get('/cart/get/:userId', async (req, res) => {
    try {
        console.log('req: ', req.params.userId);
        const cartItems = await Cart.find({ userId: req.params.userId }).populate('productId');
        if (!cartItems || cartItems.length === 0) {
            return res.status(404).json({ message: 'No cart items found', result: [] });
        }
        return res.status(200).json({ result: cartItems });
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' })
    }
})
// Update cart
router.put('/cart/update/:id', async (req, res) => {
    const { quantity, selectedSize, selectedColor } = req.body
    try {
        const cartId = await Cart.findById(req.params.id)
        if (!cartId) {
            return res.status(404).json({ message: 'Cart items not found', result: [] });
        }
        const updateCart = await Cart.findByIdAndUpdate(req.params.id, {
            $set: { quantity, selectedSize, selectedColor }
        }, { new: true })
        return res.status(200).json({ message: 'Cart updated successfully', result: updateCart, code: 200, success: true, })
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' })
    }
})
// Delete Cart
router.delete('/cart/delete/:id', async (req, res) => {
    try {
        const cartId = await Cart.findById(req.params.id)
        if (!cartId) {
            return res.status(404).json({ message: 'Cart items not found', result: [] });
        }
        await Cart.findByIdAndDelete(cartId);
        return res.status(200).json({ code: 200, success: true, message: 'Cart Deleted successfully', })
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' })
    }
})

module.exports = router;