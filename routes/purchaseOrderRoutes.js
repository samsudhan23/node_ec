const express = require('express');
const router = express.Router();
const PoModel = require('../model/purchaseOrderModel');

router.get('/getPurchaseOrderList', async (req, res) => {
    try {
        const getOrderList = await PoModel.find();
        return res.status(200).json({ result: getOrderList, code: 200, status: true })
    }
    catch (err) {
        return res.status(500).json({ message: err, status: false, code: 500 })
    }
})


router.post('/savePuchaseOrder', async (req, res) => {
    try {
        const { supplierId, purchaseItem, orderDate, expextedDate, status } = req.body;
        // Check Existing purchase
        // const existing = await PoModel.findOne({ purchaseItem });
        // if (existing) {
        //     return res.status(400).json({ message: 'Supplier already exists' })
        // }
        const savePurchaseOrder = new PoModel({ supplierId, purchaseItem, orderDate, expextedDate, status });
        await savePurchaseOrder.save();
        return res.status(200).json({ message: 'Purchase Order save succesfully', result: savePurchaseOrder, code: 200, status: true })
    }
    catch (err) {
        return res.status(500).json({ message: err, status: false, code: 500 })
    }
})

router.put('/editPuchaseOrder/:id', async (req, res) => {
    const { purchaseItem } = req.body;
    try {
        const update = await PoModel.findById(req.params.id)
        if (!update || update.length === 0) {
            return res.status(404).json({ message: "Purchase Item doesn't exists", code: 404, status: false, result: [] })
        }
        // Check Existing
        const duplicateCheck = await PoModel.findOne({ purchaseItem, _id: { $ne: req.params.id } });
        if (duplicateCheck) {
            return res.status(400).json({ message: 'Purchase Item already exists' })
        }
        const updatePuchaseOrder = await PoModel.findByIdAndUpdate(req.params.id, {
            $set: req.body,
        }, { new: true });
        return res.status(200).json({ result: updatePuchaseOrder, code: 200, success: true, message: 'Purchase Order Updated successfully', })
    }
    catch (err) {
        return res.status(500).json({ message: err, status: false, code: 500 })
    }
});

router.post('/deletePuchaseOrder', async (req, res) => {
    const { ids } = req.body;
    try {
        const delSupplier = await PoModel.findById({ _id: { $in: ids } });
        if (!delSupplier || delSupplier.length === 0) {
            return res.status(404).json({ message: "Purchase Order doesn't exists", code: 404, status: false, result: [] })
        }
        await PoModel.deleteMany({ _id: { $in: ids } })
        return res.status(200).json({ code: 200, success: true, message: 'Purchase Order Deleted successfully', })

    }
    catch (err) {
        return res.status(500).json({ message: err, status: false, code: 500 })
    }
})

module.exports = router;