const express = require('express');
const router = express.Router();
const supplierModel = require('../model/supplierModel');

router.get('/getSupplierList', async (req, res) => {
    try {
        const getSupplier = await supplierModel.find();
        return res.status(200).json({ result: getSupplier, code: 200, status: true })
    }
    catch (err) {
        return res.status(500).json({ message: err, status: false, code: 500 })
    }
})

router.post('/saveSupplier', async (req, res) => {
    try {
        const { supplierName, contactPerson, address, price } = req.body;
        // Check Existing Products
        const existing = await supplierModel.findOne({ supplierName });
        if (existing) {
            return res.status(400).json({ message: 'Supplier already exists' })
        }
        const saveSupplier = new supplierModel({ supplierName, contactPerson, address, price });
        await saveSupplier.save();
        return res.status(200).json({ message: 'Supplier save succesfully', result: saveSupplier, code: 200, status: true })
    }
    catch (err) {
        return res.status(500).json({ message: err, status: false, code: 500 })
    }
})

router.put('/editSupplier/:id', async (req, res) => {
    const { supplierName } = req.body;
    try {
        const update = await supplierModel.findById(req.params.id)
        if (!update || update.length === 0) {
            return res.status(404).json({ message: "Supplier doesn't exists", code: 404, status: false, result: [] })
        }
        // Check Existing
        const duplicateCheck = await supplierModel.findOne({ supplierName });
        if (duplicateCheck) {
            return res.status(400).json({ message: 'Supplier already exists' })
        }
        const updateSupplier = await supplierModel.findByIdAndUpdate(req.params.id, {
            $set: req.body,
        }, { new: true });
        return res.status(200).json({ result: updateSupplier, code: 200, success: true, message: 'Supplier Updated successfully', })
    }
    catch (err) {
        return res.status(500).json({ message: err, status: false, code: 500 })
    }
});

router.post('/deleteSupplier', async (req, res) => {
    const { ids } = req.body;
    try {
        const delSupplier = await supplierModel.findById({ _id: { $in: ids } });
        if (!delSupplier || delSupplier.length === 0) {
            return res.status(404).json({ message: "Supplier doesn't exists", code: 404, status: false, result: [] })
        }
        await supplierModel.deleteMany({ _id: { $in: ids } })
        return res.status(200).json({ code: 200, success: true, message: 'Supplier Deleted successfully', })

    }
    catch (err) {
        return res.status(500).json({ message: err, status: false, code: 500 })
    }
})

module.exports = router;