const express = require('express');
const router = express.Router();
const WareHouse = require('../model/warehouseModel');


router.get('/warehouseList', async (req, res) => {
    try {
        const getList = await WareHouse.find();
        return res.status(200).json({ result: getList, code: 200, success: true, })
    }
    catch (error) {
        res.status(500).res.json({ message: error, status: false, code: 500 })
    }
})

router.post('/saveWareHouse', async (req, res) => {
    const { warehouseName, address, contactPerson, phone } = req.body;
    try {
        // Check Existing
        const existing = await WareHouse.findOne({ warehouseName });
        if (existing) {
            return res.status(400).json({ message: 'Warehouse already exists' })
        }
        const newWarehouse = new WareHouse({ warehouseName, address, contactPerson, phone })
        await newWarehouse.save();
        return res.status(200).json({ message: 'Warehouse created succesfully', result: newWarehouse, code: 200, success: true, })
    }
    catch (err) {
        res.status(500).json({ message: err, status: false, code: 500 })
    }
})


router.put('/updateWarehouse/:id', async (req, res) => {
    const { warehouseName } = req.body;
    try {
        const updateWarehouse = await WareHouse.findById(req.params.id);
        if (!updateWarehouse || updateWarehouse.length === 0) {
            return res.status(404).json({ message: "Warehouse doesn't exists", result: [] })
        }
        // Check Existing
        const duplicateCheck = await WareHouse.findOne({ warehouseName, _id: { $ne: req.params.id } });
        if (duplicateCheck) {
            return res.status(400).json({ message: 'Warehouse already exists' })
        }
        const updated = await WareHouse.findByIdAndUpdate(req.params.id, {
            $set: req.body
        }, { new: true });

        return res.status(200).json({ result: updated, code: 200, success: true, message: 'Warehouse Updated successfully', })
    }
    catch (error) {
        res.status(500).json({ message: err, status: false, code: 500 })
    }
})

router.post('/deleteWarehouse', async (req, res) => {
    const { ids } = req.body
    try {
        const wareHouse = await WareHouse.find({ _id: { $in: ids } });
        if (!wareHouse || wareHouse.length === 0) {
            return res.status(404).json({ message: "Warehouse doesn't exists", result: [] })
        }
        await WareHouse.deleteMany({ _id: { $in: ids } });

        return res.status(200).json({ code: 200, success: true, message: 'Warehouse Deleted successfully', })
    }
    catch (error) {
        res.status(500).json({ message: err, status: false, code: 500 })
    }
})

module.exports = router;