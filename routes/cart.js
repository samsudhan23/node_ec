const express = require('express');
const router = express.Router();
const Cart = require('../model/cartModel');
const Products = require('../model/ProductModel');
const { resolveProductImageUrl } = require('../utils/cloudinaryImage');
// Save Cart
router.post('/cart/add', async (req, res) => {
    const { userId, productId, quantity, selectedSize } = req.body;
    try {
        const product = await Products.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found', result: [] });
        }
        // Find stock for the selected size
        const sizeInfo = product.sizeStock.find(val => val.size === selectedSize);
        if (!sizeInfo) {
            return res.status(400).json({ message: 'Selected size not available', result: [], status: false });
        }

        const availableStock = sizeInfo.stock;
        // Find existing cart item
        const existingCartItem = await Cart.findOne({ userId, productId, selectedSize });
        if (existingCartItem) {
            const newQuantity = existingCartItem.quantity + quantity;
            // Check stock before updating
            if (newQuantity > availableStock) {
                return res.status(400).json({
                    message: `Only ${availableStock} item(s) available in stock for size ${selectedSize}`,
                    result: [],
                    status: false
                });
            }
            existingCartItem.quantity = newQuantity;
            await existingCartItem.save();
            return res.status(200).json({
                message: 'Cart quantity updated successfully',
                result: existingCartItem,
                code: 200,
                success: true,
            });
        } else {
            // For new cart entry
            if (quantity > availableStock) {
                return res.status(400).json({
                    message: `Only ${availableStock} item(s) available in stock for size ${selectedSize}`,
                    result: [],
                    status: false
                });
            }
            const newProductCart = new Cart({ userId, productId, quantity, selectedSize });
            await newProductCart.save();

            return res.status(200).json({
                message: 'Product added to your Cart successfully',
                result: newProductCart,
                code: 200,
                success: true,
            });
        }
    } catch (error) {
        console.error('Cart add error:', error);
        return res.status(500).json({ message: 'Server Error' });
    }
});

// Cart List (with optional userId filter)
router.get('/cart/get', async (req, res) => {
    try {
        const { userId } = req.query;
        // Build query - filter by userId if provided
        let query = {};
        if (userId) {
            query.userId = userId;
        }
        
        const cartItems = await Cart.find(query).populate('productId').populate('userId').populate('categoryID');
        const unwantedUser = cartItems.filter(item => item.userId == null || item.productId == null)
        if (unwantedUser && unwantedUser.length > 0) {
            const idsToDelete = unwantedUser.map(item => item._id)
            await Cart.deleteMany({ _id: { $in: idsToDelete } });
        }
        
        // Re-fetch after cleanup
        const clearCartList = await Cart.find(query).populate('productId').populate('userId').populate('categoryID');
        const cartWithImagePaths = clearCartList.map(item => {
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
        return res.status(200).json({ result: cartWithImagePaths, code: 200, success: true });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server Error' })
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
        return res.status(500).json({ message: 'Server Error' })
    }
})
// Update cart
router.put('/cart/update/:id', async (req, res) => {
    const { userId, productId, quantity, selectedSize } = req.body;

    try {
        // Step 1: Find the cart record being updated
        const cartItem = await Cart.findById(req.params.id);
        if (!cartItem) {
            return res.status(404).json({ message: 'Cart item not found', result: [] });
        }

        // Step 2: Get product and stock info
        const product = await Products.findById(productId || cartItem.productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found', result: [] });
        }

        const sizeInfo = product.sizeStock.find(val => val.size === selectedSize);
        if (!sizeInfo) {
            return res.status(400).json({ message: 'Selected size not available', result: [], status: false });
        }

        const availableStock = sizeInfo.stock;

        // Step 3: Stock validation
        if (quantity > availableStock) {
            return res.status(400).json({
                message: `Only ${availableStock} item(s) available for size ${selectedSize}`,
                result: [],
                status: false
            });
        }

        // Step 4: Check if another cart item already exists for same product & size
        const existingCartItem = await Cart.findOne({
            userId,
            productId,
            selectedSize,
            _id: { $ne: req.params.id } // exclude current record
        });

        // Step 5: If another same product+size exists, merge them
        if (existingCartItem) {
            const totalQuantity = existingCartItem.quantity + quantity;

            if (totalQuantity > availableStock) {
                return res.status(400).json({
                    message: `Cannot merge – only ${availableStock} item(s) available for this size`,
                    result: [],
                    status: false
                });
            }

            // Merge quantities
            existingCartItem.quantity = totalQuantity;
            await existingCartItem.save();

            // Delete the current record since it’s merged
            await Cart.findByIdAndDelete(cartItem._id);

            return res.status(200).json({
                message: 'Cart items merged successfully',
                result: existingCartItem,
                code: 200,
                success: true
            });
        }

        // Step 6: Normal update
        const updatedCart = await Cart.findByIdAndUpdate(
            req.params.id,
            { $set: { userId, productId, quantity, selectedSize } },
            { new: true }
        );

        return res.status(200).json({
            message: 'Cart updated successfully',
            result: updatedCart,
            code: 200,
            success: true
        });

    } catch (error) {
        console.error('Cart update error:', error);
        return res.status(500).json({ message: 'Server Error', success: false });
    }
});

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
        return res.status(500).json({ message: 'Server Error' })
    }
})

module.exports = router;