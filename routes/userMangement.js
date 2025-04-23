const express = require('express');
const router = express.Router();
const Users = require('../model/User');


// User List
router.get('/getAllUsers', async (req, res) => {
    try {
        const users = await Users.find();
        return res.status(200).json({ result: users, code: 200, success: true })
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' })
    }
})
// Save User
router.post('/saveUser', async (req, res) => {
    const { email, phoneNumber } = req.body;
    try {
        const existingEmail = await Users.findOne({
            $or: [
                { email },
                { phoneNumber }
            ]
        })
        if (existingEmail) { return res.status(400).json({ message: 'Email or Phone Number already exit' }) }

        const newUser = new Users(req.body);
        await newUser.save();
        return res.status(200).json({ message: 'User saved Successfully', result: newUser, code: 200, success: true })
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' })
    }
})
// Update User
router.put('/updateUser/:id', async (req, res) => {
    try {
        const id = await Users.findById(req.params.id)
        if (!id) { return res.status(404).json({ message: "User doesn't exits" }) }

        const editUser = await Users.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        return res.status(200).json({ message: 'User Updated Successfully', result: editUser, code: 200, success: true })
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' })
    }
})
// Delete User
router.delete('/deleteUser/:id', async (req, res) => {
    try {
        const id = await Users.findById(req.params.id);
        if (!id) { return res.status(404).json({ message: "User doesn't exits" }) };
        await Users.findByIdAndDelete(req.params.id)
        return res.status(200).json({ message: 'User Deleted Successfully', code: 200, success: true })
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' })
    }
})

module.exports = router