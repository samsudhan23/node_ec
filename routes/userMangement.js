const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt')
const Users = require('../model/User');
const uploadAvatar = require('../utils/multerUserAvatar');


// User List
router.get('/getAllUsers', async (req, res) => {
    try {
        const users = await Users.find();
        // Convert avatar buffer to base64 for response
        const usersWithBase64Avatar = users.map(user => {
            const userObj = user.toObject();
            if (userObj.avatar && userObj.avatar.data) {
                userObj.avatar = {
                    data: userObj.avatar.data.toString('base64'),
                    contentType: userObj.avatar.contentType
                };
            }
            return userObj;
        });
        return res.status(200).json({ result: usersWithBase64Avatar, code: 200, success: true })
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' })
    }
})
// Save User
router.post('/saveUser', uploadAvatar.single('avatar'), async (req, res) => {
    const { name, email, phoneNumber, password, dateOfBirth, role, gender, altPhoneNumber, addressLine1, streetLocality, addressLine2, city, state, pincode, country } = req.body;
    try {
        const existingEmail = await Users.findOne({
            $or: [
                { email },
                { phoneNumber }
            ]
        })
        if (existingEmail) { return res.status(400).json({ message: 'Email or Phone Number already exit' }) }
        const hashedPassword = await bcrypt.hash(password, 10)
        
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
            country
        };

        // Handle avatar file upload (binary data)
        if (req.file) {
            userData.avatar = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            };
        }

        const newUser = new Users(userData);
        await newUser.save();

        // Convert avatar buffer to base64 for response
        let userResponse = newUser.toObject();
        if (userResponse.avatar && userResponse.avatar.data) {
            userResponse.avatar = {
                data: userResponse.avatar.data.toString('base64'),
                contentType: userResponse.avatar.contentType
            };
        }

        return res.status(200).json({ message: 'User saved Successfully', result: userResponse, code: 200, success: true })
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message })
    }
})
// Update User
router.put('/updateUser/:id', uploadAvatar.single('avatar'), async (req, res) => {
    const { email, phoneNumber } = req.body;
    try {
        const user = await Users.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User doesn't exist" });
        }
        
        // Build conditions array only for values that are different from current user's values
        const conditions = [];
        
        // Convert to strings and normalize for comparison
        const currentEmail = String(user.email || '').trim();
        const currentPhoneNumber = String(user.phoneNumber || '').trim();
        const newEmail = email ? String(email).trim() : '';
        const newPhoneNumber = phoneNumber ? String(phoneNumber).trim() : '';
        
        // Only check email if it's provided, not empty, and different from current value
        if (newEmail !== '' && newEmail !== currentEmail) {
            conditions.push({ email: newEmail });
        }
        
        // Only check phoneNumber if it's provided, not empty, and different from current value
        if (newPhoneNumber !== '' && newPhoneNumber !== currentPhoneNumber) {
            conditions.push({ phoneNumber: newPhoneNumber });
        }
        
        // Only check if there are conditions to check (i.e., values are being changed)
        if (conditions.length > 0) {
            const existingUser = await Users.findOne({
                $or: conditions,
                _id: { $ne: req.params.id }
            });

            if (existingUser) {
                return res.status(400).json({ message: "Email or Phone Number already exists" });
            }
        }

        // Prepare update data
        const updateData = { ...req.body };
        
        // Handle avatar file upload (binary data)
        if (req.file) {
            updateData.avatar = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            };
        }

        const editUser = await Users.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );

        // Convert avatar buffer to base64 for response (optional, for frontend display)
        let userResponse = editUser.toObject();
        if (userResponse.avatar && userResponse.avatar.data) {
            userResponse.avatar = {
                data: userResponse.avatar.data.toString('base64'),
                contentType: userResponse.avatar.contentType
            };
        }

        return res.status(200).json({
            message: 'User Updated Successfully',
            result: userResponse,
            code: 200,
            success: true
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// Delete User
router.post('/deleteUser', async (req, res) => {
    const { ids } = req.body
    try {
        const id = await Users.find({ _id: { $in: ids } });
        if (!id || id.length === 0) { return res.status(404).json({ message: "User doesn't exits" }) };
        await Users.deleteMany({ _id: { $in: ids } })
        return res.status(200).json({ message: 'User Deleted Successfully', code: 200, success: true })
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' })
    }
})

module.exports = router