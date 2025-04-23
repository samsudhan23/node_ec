const express = require('express');
const otpGenerator = require('otp-generator');
const router = express.Router();
const bcrypt = require('bcrypt')
const Users = require('../model/User');
const sendOTPMail = require('../utils/mailer');
const Otp = require('../model/Otp');
const crypto = require('crypto');

router.post("/auth/send-otp", async (req, res) => {
    const { email, phoneNumber } = req.body;
    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
    const otpExpiry = Date.now() + 5 * 60 * 1000;
    await Otp.create({ email, otp, otpExpiry })
    // await Otp.findOneAndUpdate(
    //     { email },
    //     { email, otp, createdAt: new Date() },
    //     { upsert: true, new: true }
    //   );
    await sendOTPMail(email, otp);
    // await sendOtpSms(phoneNumber, otp)
    return res.status(200).json({ message: 'OTP sent to email' });
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

        if (!validOtp || validOtp.otpExpiry < Date.now()) return res.status(500).json({ message: 'Invalid OTP' });

        await Otp.deleteMany({ email });
        // res.status(200).json({ message: 'OTP verified successfully' });

        // Encrypt Password
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = new Users({ name, email, password: hashedPassword, phoneNumber })
        await newUser.save();

        return res.status(200).json({ message: 'OTP verified successfully', result: newUser.id, name, email, code: 200 })
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
        return res.status(200).json({ message: 'User Registered Succesfully', name, phoneNumber, email, code: 200 })
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

// POST: Request reset
router.post('/auth/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await Users.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const token = crypto.randomBytes(20).toString('hex');

        user.resetToken = token;
        user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetUrl = `http://localhost:4200/reset-password/${token}`;
        const html = `<p>Click the link below to reset your password:</p><a href="${resetUrl}">${resetUrl}</a>`;

        await sendOTPMail(user.email, html, 'Reset Password', false);
        return res.status(200).json({ message: 'Reset link sent to your email' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/auth/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        const user = await Users.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        return res.status(200).json({ message: 'Password reset successfully' });

    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
