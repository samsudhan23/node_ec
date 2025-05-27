const express = require('express');
const router = express.Router();
const Orders = require('../model/placeOrderModel');

// Order placed Post for Users
router.post("/post/order", async (req, res) => {
    try {
        const newOrders = new Orders(req.body);
        await newOrders.save();
        return res.status(200).json({ message: 'Order placed successfully', code: 200, success: true, result: newOrders })
    }
    catch (error) {
        res.status(500).res.json({ message: 'Server Error', success: false })
    }
})

// Get Orders (for users)
router.get("/get/orderByUser/:id", async (req, res) => {
    const orderId = res.params.id;
    try {
        const orderListById = await Orders.findById(orderId);
        if (!orderListById) {
            return res.status(404).json({ message: "Order doesn't exists", code: 400, success: false, result: [] })
        }
        return res.status(200).json({ code: 200, success: true, result: orderListById })
    }
    catch (error) {
        res.status(500).res.json({ message: 'Server Error', success: false })
    }
})

//Get All Orders (for admin)
router.get("/get/orders", async (req, res) => {
    try {
        const ordersList = await Orders.find();
        return res.status(200).json({ code: 200, status: true, result: ordersList })
    }
    catch (error) {
        res.status(500).res.json({ message: 'Server Error', success: false })
    }
});

//  Cancel Order (user-side)
router.delete("/delete/cancelOrder/:id", async (req, res) => {
    const orderId = res.params.id;
    try {
        const cancelOrder = await Orders.findById(orderId)
        if (!cancelOrder) {
            return res.status(404).json({ message: "Order doesn't exists", success: false, result: [] })
        }
        await Orders.findByIdAndDelete(orderId)
        return res.status(200).json({ message: "Order cancel successfully", code: 200, status: true })
    }
    catch (error) {
        res.status(500).res.json({ message: 'Server Error', success: false })
    }
})

// router.put("/update/order/:id", async (req, res) => {
//     const { orderStatus } = req.body;
//     const { orderId } = req.params.id;
//     try {
//      const order = await Orders.findById(orderId);
//      if(!order){
//         res.status()
//      }
//     }
//     catch (error) {
//         res.status(500).res.json({ message: 'Server Error', success: false })
//     }
// })