const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Users = require('../model/User');
const uploadAvatar = require('../utils/multerUserAvatar');
const { deleteCloudinaryAsset } = require('../utils/cloudinaryImage');

const formatUserAvatar = (userObj) => {
    if (!userObj.avatar) {
        return userObj;
    }

    if (typeof userObj.avatar === 'string') {
        return userObj;
    }

    if (userObj.avatar.data) {
        userObj.avatar = {
            data: userObj.avatar.data.toString('base64'),
            contentType: userObj.avatar.contentType,
        };
    }

    return userObj;
};

// User List
router.get('/getAllUsers', async (req, res) => {
    try {
        const users = await Users.find();
        const usersWithAvatar = users.map((user) => formatUserAvatar(user.toObject()));
        return res.status(200).json({ result: usersWithAvatar, code: 200, success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Save User
router.post('/saveUser', uploadAvatar.single('avatar'), async (req, res) => {
    const { name, email, phoneNumber, password, dateOfBirth, role, gender, altPhoneNumber, addressLine1, streetLocality, addressLine2, city, state, pincode, country } = req.body;
    try {
        const existingEmail = await Users.findOne({
            $or: [{ email }, { phoneNumber }],
        });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email or Phone Number already exit' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userData = {
            name,
            email,
            password: hashedPassword,
            phoneNumber,
            dateOfBirth,
            role,
            gender,
            altPhoneNumber,
            addressLine1,
            streetLocality,
            addressLine2,
            city,
            state,
            pincode,
            country,
        };

        if (req.file) {
            userData.avatar = req.file.path;
        }

        const newUser = new Users(userData);
        await newUser.save();

        const userResponse = formatUserAvatar(newUser.toObject());
        return res.status(200).json({ message: 'User saved Successfully', result: userResponse, code: 200, success: true });
    } catch (error) {
        if (req.file?.filename) {
            await deleteCloudinaryAsset(req.file.path);
        }
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// Update User
router.put('/updateUser/:id', uploadAvatar.single('avatar'), async (req, res) => {
    const { email, phoneNumber } = req.body;
    try {
        const user = await Users.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User doesn't exist" });
        }

        const conditions = [];
        const currentEmail = String(user.email || '').trim();
        const currentPhoneNumber = String(user.phoneNumber || '').trim();
        const newEmail = email ? String(email).trim() : '';
        const newPhoneNumber = phoneNumber ? String(phoneNumber).trim() : '';

        if (newEmail !== '' && newEmail !== currentEmail) {
            conditions.push({ email: newEmail });
        }

        if (newPhoneNumber !== '' && newPhoneNumber !== currentPhoneNumber) {
            conditions.push({ phoneNumber: newPhoneNumber });
        }

        if (conditions.length > 0) {
            const existingUser = await Users.findOne({
                $or: conditions,
                _id: { $ne: req.params.id },
            });

            if (existingUser) {
                if (req.file?.filename) {
                    await deleteCloudinaryAsset(req.file.path);
                }
                return res.status(400).json({ message: 'Email or Phone Number already exists' });
            }
        }

        const updateData = { ...req.body };

        if (req.file) {
            if (user.avatar && typeof user.avatar === 'string' && user.avatar.includes('cloudinary.com')) {
                await deleteCloudinaryAsset(user.avatar);
            }
            updateData.avatar = req.file.path;
        }

        const editUser = await Users.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
        const userResponse = formatUserAvatar(editUser.toObject());

        return res.status(200).json({
            message: 'User Updated Successfully',
            result: userResponse,
            code: 200,
            success: true,
        });
    } catch (error) {
        if (req.file?.filename) {
            await deleteCloudinaryAsset(req.file.path);
        }
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// Delete User
router.post('/deleteUser', async (req, res) => {
    const { ids } = req.body;
    try {
        const users = await Users.find({ _id: { $in: ids } });
        if (!users || users.length === 0) {
            return res.status(404).json({ message: "User doesn't exits" });
        }

        for (const user of users) {
            if (user.avatar && typeof user.avatar === 'string' && user.avatar.includes('cloudinary.com')) {
                await deleteCloudinaryAsset(user.avatar);
            }
        }

        await Users.deleteMany({ _id: { $in: ids } });
        return res.status(200).json({ message: 'User Deleted Successfully', code: 200, success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
