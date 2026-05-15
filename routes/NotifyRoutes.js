const express = require('express');
const router = express.Router();
const Products = require('../model/ProductModel')
const Notify = require('../model/NotifyModel')


router.post('/notify', async (req, res) => {
  const { userId, productId, selectedSize } = req.body;

  try {
    const product = await Products.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found', success: false });
    }

    // Prevent duplicates
    const existing = await Notify.findOne({ userId, productId, selectedSize });
    if (existing) {
      return res.status(200).json({ message: 'Already requested for this product', success: true });
    }

    const notify = new Notify({ userId, productId, selectedSize });
    await notify.save();

    return res.status(200).json({ message: 'Request saved successfully', success: true, result: notify });

  } catch (error) {
    console.error('Notify POST error:', error);
    return res.status(500).json({ message: 'Server Error', success: false });
  }
});

router.get('/notify/admin', async (req, res) => {
  try {
    const notifyStats = await Notify.aggregate([
      {
        $group: {
          _id: { productId: "$productId", selectedSize: "$selectedSize" },
          totalRequests: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "_id.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: "$product"
      },
      {
        $project: {
          productName: "$product.productName",
          selectedSize: "$_id.selectedSize",
          totalRequests: 1
        }
      },
      { $sort: { totalRequests: -1 } }
    ]);

    return res.status(200).json({ success: true, result: notifyStats });
  } catch (error) {
    console.error('Notify GET admin error:', error);
    return res.status(500).json({ message: 'Server Error', success: false });
  }
});
module.exports = router;
