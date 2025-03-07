const express = require('express');
const Users = require('../model/User');

const router = express.Router();

router.post("/auth/register", async (req, res) => {
    const { name, phoneNumber, email, password } = req.body;

    try {
        let user = await Users.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' })
        }
        user = new Users({ name, email, password, phoneNumber })
        await user.save();
        res.status(200).json({ message: 'User Registered Succesfully', result: user.id, name, email, code: 200 })
    } catch (err) {
        console.log('err: ', err);
        res.status(500).json({ message: 'Server Error' })
    }
});

router.post("/auth/login", async (req, res) => {
    const { login, password } = req.body;
    try {
        let user = await Users.findOne({ $or: [{ email: login }, { phoneNumber: login }], password });
        if (!user) {
            res.status(400).json({ message: 'Invalid credentials' })
        }
        await user.save();
        res.status(200).json({ message: 'Login Successfully', result: user.id, email, code: 200 })
    }
    catch (err) {
        res.status(500).json({ message: 'Server Error' })
    }
})


module.exports = router;
