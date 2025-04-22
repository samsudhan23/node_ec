const express = require('express');
const otpGenerator = require('otp-generator');
const router = express.Router();
const bcrypt = require('bcrypt')
const Users = require('../model/User');
const sendOTPMail = require('../utils/mailer');
const Otp = require('../model/Otp');
// const sendOtpSms = require('../utils/sendSms');

router.post("/auth/send-otp", async (req, res) => {
    const { email, phoneNumber } = req.body;
    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
    await Otp.create({ email, otp })
    // await Otp.findOneAndUpdate(
    //     { email },
    //     { email, otp, createdAt: new Date() },
    //     { upsert: true, new: true }
    //   );
    await sendOTPMail(email, otp);
    // await sendOtpSms(phoneNumber, otp)
    res.status(200).json({ message: 'OTP sent to email' });
})

router.post("/auth/verify-otp", async (req, res) => {
    const { name, phoneNumber, email, password, otp } = req.body;

    try {
        let existingUser = await Users.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' })
        }

        // OTP Verification
        const validOtp = await Otp.findOne({ email, otp });

        if (!validOtp) res.status(500).json({ message: 'Invalid OTP' });

        await Otp.deleteMany({ email });
        // res.status(200).json({ message: 'OTP verified successfully' });

        // Encrypt Password
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = new Users({ name, email, password: hashedPassword, phoneNumber })
        await newUser.save();

        res.status(200).json({ message: 'OTP verified successfully', result: newUser.id, name, email, code: 200 })
    } catch (err) {
        console.log('err: ', err);
        res.status(500).json({ message: 'Server Error' })
    }

})

router.post("/auth/register", async (req, res) => {
    const { name, phoneNumber, email, password } = req.body;

    try {
        let user = await Users.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' })
        }
        // user = new Users({ name, email, password, phoneNumber })
        // await user.save();
        res.status(200).json({ message: 'User Registered Succesfully', name, phoneNumber, email, code: 200 })
    } catch (err) {
        console.log('err: ', err);
        res.status(500).json({ message: 'Server Error' })
    }
});

router.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await Users.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Email' })
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }
        await user.save();
        res.status(200).json({ message: 'Login Successfully', result: user.id, email: user.email, code: 200 })
    }
    catch (err) {
        res.status(500).json({ message: 'Server Error' })
    }
})


module.exports = router;
