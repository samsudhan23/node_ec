const express = require('express');
const router = express.Router();
const DeliveryAddress = require('../model/deliveryAddressModel');

// Create new delivery address
router.post('/deliveryAddress/add', async (req, res) => {
    const { userId, fullName, addressLine, landmark, city, state, postalCode, country, phone, alternatePhoneNumber, isDefault } = req.body;
    
    try {
        // Validate required fields
        if (!userId || !fullName || !addressLine || !city || !state || !postalCode || !phone) {
            return res.status(400).json({ 
                message: 'Missing required fields', 
                result: [], 
                code: 400, 
                success: false 
            });
        }

        // If this is set as default, unset other default addresses for this user
        if (isDefault === true) {
            await DeliveryAddress.updateMany(
                { userId, isDefault: true },
                { $set: { isDefault: false } }
            );
        }

        const newAddress = new DeliveryAddress({
            userId,
            fullName,
            addressLine,
            landmark,
            city,
            state,
            postalCode,
            country: country || 'India',
            phone,
            alternatePhoneNumber,
            isDefault: isDefault || false,
        });

        await newAddress.save();

        return res.status(200).json({
            message: 'Delivery address added successfully',
            result: newAddress,
            code: 200,
            success: true,
        });
    } catch (error) {
        console.error('Delivery address add error:', error);
        return res.status(500).json({ 
            message: 'Server Error', 
            code: 500, 
            success: false 
        });
    }
});

// Get all delivery addresses (for admin)
router.get('/deliveryAddress/getAll', async (req, res) => {
    try {
        const addresses = await DeliveryAddress.find()
            .populate('userId', 'name email phoneNumber')
            .sort({ createdAt: -1 }); // Sort by creation date

        return res.status(200).json({ 
            result: addresses, 
            code: 200, 
            success: true 
        });
    } catch (error) {
        console.error('Delivery address getAll error:', error);
        return res.status(500).json({ 
            message: 'Server Error', 
            code: 500, 
            success: false 
        });
    }
});

// Get all delivery addresses for a user
router.get('/deliveryAddress/get/:userId', async (req, res) => {
    try {
        const addresses = await DeliveryAddress.find({ userId: req.params.userId })
            .populate('userId', 'name email phoneNumber')
            .sort({ isDefault: -1, createdAt: -1 }); // Default addresses first, then by creation date

        if (!addresses || addresses.length === 0) {
            return res.status(404).json({ 
                message: 'No delivery addresses found', 
                result: [], 
                code: 404, 
                success: false 
            });
        }

        return res.status(200).json({ 
            result: addresses, 
            code: 200, 
            success: true 
        });
    } catch (error) {
        console.error('Delivery address get error:', error);
        return res.status(500).json({ 
            message: 'Server Error', 
            code: 500, 
            success: false 
        });
    }
});

// Get single delivery address by ID
router.get('/deliveryAddress/getById/:id', async (req, res) => {
    try {
        const address = await DeliveryAddress.findById(req.params.id)
            .populate('userId', 'name email phoneNumber');

        if (!address) {
            return res.status(404).json({ 
                message: 'Delivery address not found', 
                result: [], 
                code: 404, 
                success: false 
            });
        }

        return res.status(200).json({ 
            result: address, 
            code: 200, 
            success: true 
        });
    } catch (error) {
        console.error('Delivery address getById error:', error);
        return res.status(500).json({ 
            message: 'Server Error', 
            code: 500, 
            success: false 
        });
    }
});

// Update delivery address
router.put('/deliveryAddress/update/:id', async (req, res) => {
    const { fullName, addressLine, landmark, city, state, postalCode, country, phone, alternatePhoneNumber, isDefault } = req.body;

    try {
        const address = await DeliveryAddress.findById(req.params.id);
        if (!address) {
            return res.status(404).json({ 
                message: 'Delivery address not found', 
                result: [], 
                code: 404, 
                success: false 
            });
        }

        // If setting as default, unset other default addresses for this user
        if (isDefault === true && address.isDefault !== true) {
            await DeliveryAddress.updateMany(
                { userId: address.userId, isDefault: true, _id: { $ne: req.params.id } },
                { $set: { isDefault: false } }
            );
        }

        // Update address fields
        const updateData = {};
        if (fullName !== undefined) updateData.fullName = fullName;
        if (addressLine !== undefined) updateData.addressLine = addressLine;
        if (landmark !== undefined) updateData.landmark = landmark;
        if (city !== undefined) updateData.city = city;
        if (state !== undefined) updateData.state = state;
        if (postalCode !== undefined) updateData.postalCode = postalCode;
        if (country !== undefined) updateData.country = country;
        if (phone !== undefined) updateData.phone = phone;
        if (alternatePhoneNumber !== undefined) updateData.alternatePhoneNumber = alternatePhoneNumber;
        if (isDefault !== undefined) updateData.isDefault = isDefault;

        const updatedAddress = await DeliveryAddress.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        ).populate('userId', 'name email phoneNumber');

        return res.status(200).json({
            message: 'Delivery address updated successfully',
            result: updatedAddress,
            code: 200,
            success: true,
        });
    } catch (error) {
        console.error('Delivery address update error:', error);
        return res.status(500).json({ 
            message: 'Server Error', 
            code: 500, 
            success: false 
        });
    }
});

// Set default delivery address
router.put('/deliveryAddress/setDefault/:id', async (req, res) => {
    try {
        const address = await DeliveryAddress.findById(req.params.id);
        if (!address) {
            return res.status(404).json({ 
                message: 'Delivery address not found', 
                result: [], 
                code: 404, 
                success: false 
            });
        }

        // Unset all other default addresses for this user
        await DeliveryAddress.updateMany(
            { userId: address.userId, isDefault: true, _id: { $ne: req.params.id } },
            { $set: { isDefault: false } }
        );

        // Set this address as default
        const updatedAddress = await DeliveryAddress.findByIdAndUpdate(
            req.params.id,
            { $set: { isDefault: true } },
            { new: true }
        ).populate('userId', 'name email phoneNumber');

        return res.status(200).json({
            message: 'Default delivery address set successfully',
            result: updatedAddress,
            code: 200,
            success: true,
        });
    } catch (error) {
        console.error('Set default address error:', error);
        return res.status(500).json({ 
            message: 'Server Error', 
            code: 500, 
            success: false 
        });
    }
});

// Delete delivery address(es)
router.post('/deliveryAddress/delete', async (req, res) => {
    const { ids } = req.body;

    try {
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ 
                message: 'Please provide address IDs to delete', 
                result: [], 
                code: 400, 
                success: false 
            });
        }

        const addresses = await DeliveryAddress.find({ _id: { $in: ids } });
        if (!addresses || addresses.length === 0) {
            return res.status(404).json({ 
                message: 'Delivery addresses not found', 
                result: [], 
                code: 404, 
                success: false 
            });
        }

        await DeliveryAddress.deleteMany({ _id: { $in: ids } });

        return res.status(200).json({ 
            message: 'Delivery address(es) deleted successfully', 
            code: 200, 
            success: true 
        });
    } catch (error) {
        console.error('Delivery address delete error:', error);
        return res.status(500).json({ 
            message: 'Server Error', 
            code: 500, 
            success: false 
        });
    }
});

// Get default delivery address for a user
router.get('/deliveryAddress/getDefault/:userId', async (req, res) => {
    try {
        const defaultAddress = await DeliveryAddress.findOne({ 
            userId: req.params.userId, 
            isDefault: true 
        }).populate('userId', 'name email phoneNumber');

        if (!defaultAddress) {
            return res.status(404).json({ 
                message: 'No default delivery address found', 
                result: [], 
                code: 404, 
                success: false 
            });
        }

        return res.status(200).json({ 
            result: defaultAddress, 
            code: 200, 
            success: true 
        });
    } catch (error) {
        console.error('Get default address error:', error);
        return res.status(500).json({ 
            message: 'Server Error', 
            code: 500, 
            success: false 
        });
    }
});

module.exports = router;

