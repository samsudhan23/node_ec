const express = require('express');
const router = express.Router();
const Cart = require('../model/cartModel');
const Products = require('../model/ProductModel');
const { find } = require('../model/User');

router.post('/cart/add', async (req, res) => {
    const { userId, productId, quantity, selectedSize, selectedColor } = req.body;
    try {
        const product = await Products.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const existingCartItem = await Cart.findOne({ userId, productId, selectedSize, selectedColor });
        if (existingCartItem) {
            existingCartItem.quantity += quantity;
            await existingCartItem.save();
            return res.status(200).json({ message: 'Product quantity updated in cart', result: existingCartItem });
        } else {

            const newProductCart = new Cart({ userId, productId, quantity, selectedSize, selectedColor });
            await newProductCart.save();
            return res.status(200).json({ message: 'Product added to your Cart successfully', result: newProductCart });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' })
    }

})

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

module.exports = router;