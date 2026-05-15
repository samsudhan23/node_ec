const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Products = require('../model/ProductModel');
const axios = require('axios');
const uploadFiles = require('../utils/multer');
const { handleUpload } = require('../utils/uploadMiddleware');
const {
    applyProductUploads,
    getFileUrl,
    stripInvalidImageFields,
    deleteUploadedFiles,
    deleteCloudinaryAsset,
    isImageUsedByOtherProducts,
    resolveProductImageUrl,
    getImageReferences,
    imageUrlMatches,
    isCloudinaryUrl,
} = require('../utils/cloudinaryImage');

const productUpload = handleUpload(
    uploadFiles.fields([
        { name: 'images', maxCount: 1 },
        { name: 'gallery', maxCount: 5 },
    ])
);

/* create new product */
router.post('/products', productUpload, async (req, res) => {
    const { category, productName, gender, totalStock } = req.body;
    try {
        const isInvalidField = (value) => !value || value.trim() === '' || value == 0;
        if (isInvalidField(category)) {
            await deleteUploadedFiles(req.files);
            return res.status(400).json({ message: 'Category is required' });
        }

        if (isInvalidField(gender)) {
            await deleteUploadedFiles(req.files);
            return res.status(400).json({ message: 'Gender is required' });
        }

        req.body.inStock = totalStock > 0;

        const existingProducts = await Products.findOne({ productName, category });
        if (existingProducts) {
            await deleteUploadedFiles(req.files);
            return res.status(400).json({ message: 'Product already exists for this gender and category' });
        }

        stripInvalidImageFields(req.body);

        try {
            applyProductUploads(req);
        } catch (uploadErr) {
            await deleteUploadedFiles(req.files);
            return res.status(400).json({ message: uploadErr.message });
        }

        if (!req.body.images || !isCloudinaryUrl(req.body.images)) {
            await deleteUploadedFiles(req.files);
            return res.status(400).json({
                message: 'Product image is required. Upload an image file — it must be stored on Cloudinary.',
            });
        }

        if (!req.body.gallery?.length || !req.body.gallery.every(isCloudinaryUrl)) {
            await deleteUploadedFiles(req.files);
            return res.status(400).json({
                message: 'At least one gallery image is required. Upload image files.',
            });
        }

        req.body.sku = await generateSku();
        const newProduct = new Products(req.body);
        await newProduct.save();
        return res.status(200).json({ message: 'Product created successfully', result: newProduct, code: 200, success: true });
    } catch (error) {
        await deleteUploadedFiles(req.files);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((val) => val.message);
            return res.status(400).json({ message: messages });
        }
        console.error('Create product error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

/* update product */
router.put('/updateProducts/:id', productUpload, async (req, res) => {
    try {
        if (Array.isArray(req.body.discountPrice)) {
            req.body.discountPrice = req.body.discountPrice.length > 0
                ? parseFloat(req.body.discountPrice[req.body.discountPrice.length - 1]) || 0
                : 0;
        } else if (req.body.discountPrice !== undefined && req.body.discountPrice !== null && req.body.discountPrice !== '') {
            req.body.discountPrice = parseFloat(req.body.discountPrice) || 0;
        }

        const products = await Products.findById(req.params.id);
        if (!products) {
            await deleteUploadedFiles(req.files);
            return res.status(404).json({ message: "Product doesn't exists", result: [] });
        }

        const { productName, category } = req.body;
        const existingSlug = await Products.findOne({ productName, category });
        if (existingSlug && existingSlug._id.toString() !== req.params.id) {
            await deleteUploadedFiles(req.files);
            return res.status(400).json({ message: 'A product with the same name already exists in this category and gender.', result: [] });
        }

        const updatePayload = { ...req.body };
        delete updatePayload.existingGallery;
        delete updatePayload.existingImage;
        stripInvalidImageFields(updatePayload);

        let newGalleryUrls = [];
        if (req.files?.gallery?.length) {
            newGalleryUrls = req.files.gallery.map(getFileUrl);
            if (newGalleryUrls.some((url) => !url)) {
                await deleteUploadedFiles(req.files);
                return res.status(400).json({ message: 'Gallery upload failed.' });
            }
        }

        // Main image: only replace when user explicitly uploads a new file
        if (req.files?.images?.[0]) {
            const imageUrl = getFileUrl(req.files.images[0]);
            if (!imageUrl) {
                await deleteUploadedFiles(req.files);
                return res.status(400).json({ message: 'Main image upload failed.' });
            }
            if (products.images) {
                const isUsed = await isImageUsedByOtherProducts(products.images, req.params.id);
                if (!isUsed) {
                    await deleteCloudinaryAsset(products.images);
                }
            }
            updatePayload.images = imageUrl;
        } else {
            delete updatePayload.images;
            const existingImage = req.body.existingImage;
            if (existingImage && isCloudinaryUrl(existingImage)) {
                updatePayload.images = existingImage;
            }
        }

        const normalizeGalleryList = (list) => {
            const raw = Array.isArray(list) ? list : list ? [list] : [];
            return raw
                .map((img) => resolveProductImageUrl(img, req))
                .filter(isCloudinaryUrl);
        };

        if (req.files?.gallery?.length || req.body.existingGallery) {
            const existingGallery = normalizeGalleryList(req.body.existingGallery || []);
            updatePayload.gallery = [...existingGallery, ...newGalleryUrls];

            if (products.gallery?.length > 0) {
                const removed = products.gallery.filter(
                    (oldImg) => !updatePayload.gallery.includes(oldImg)
                );

                for (const oldImage of removed) {
                    if (oldImage === products.images) {
                        continue;
                    }
                    const isUsed = await isImageUsedByOtherProducts(oldImage, req.params.id);
                    if (!isUsed) {
                        await deleteCloudinaryAsset(oldImage);
                    }
                }
            }
        } else {
            delete updatePayload.gallery;
        }

        const updateProducts = await Products.findByIdAndUpdate(
            req.params.id,
            { $set: updatePayload },
            { new: true }
        );

        return res.status(200).json({ result: updateProducts, code: 200, success: true, message: 'Product Updated successfully' });
    } catch (error) {
        console.error('Update product error:', error);
        await deleteUploadedFiles(req.files);
        res.status(500).json({ message: 'Server Error' });
    }
});

const deleteGalleryImageCore = async (productId, imageUrl, imageIndex) => {
    const product = await Products.findById(productId);
    if (!product) {
        return { status: 404, body: { success: false, message: "Product doesn't exist" } };
    }

    let galleryIndex = -1;

    if (imageUrl) {
        galleryIndex = product.gallery.findIndex((img) => imageUrlMatches(img, imageUrl));
    }

    if (galleryIndex === -1 && imageIndex !== undefined && imageIndex !== null && imageIndex !== '') {
        const idx = parseInt(imageIndex, 10);
        if (!Number.isNaN(idx) && idx >= 0 && idx < product.gallery.length) {
            galleryIndex = idx;
        }
    }

    if (galleryIndex === -1) {
        return {
            status: 400,
            body: {
                success: false,
                message: 'Image not found in this product gallery. Save the product and try again.',
            },
        };
    }

    const removedUrl = product.gallery[galleryIndex];

    if (product.images && imageUrlMatches(product.images, removedUrl)) {
        return {
            status: 400,
            body: { success: false, message: 'Cannot delete the main product image from gallery' },
        };
    }

    if (product.gallery.length <= 1) {
        return {
            status: 400,
            body: { success: false, message: 'At least one gallery image is required' },
        };
    }

    product.gallery.splice(galleryIndex, 1);
    await product.save();

    const isUsedElsewhere = await isImageUsedByOtherProducts(removedUrl, product._id);
    if (!isUsedElsewhere) {
        await deleteCloudinaryAsset(removedUrl);
    }

    return {
        status: 200,
        body: {
            success: true,
            code: 200,
            message: 'Gallery image deleted successfully',
            result: product,
        },
    };
};

const deleteGalleryImageHandler = async (req, res) => {
    const productId = req.params.id || req.body?.productId;
    const imageUrl = (req.body?.imageUrl || req.query?.imageUrl || '').trim();
    const imageIndex = req.body?.imageIndex;

    if (!productId) {
        return res.status(400).json({ success: false, message: 'productId is required' });
    }

    if (!imageUrl && (imageIndex === undefined || imageIndex === null || imageIndex === '')) {
        return res.status(400).json({ success: false, message: 'imageUrl or imageIndex is required' });
    }

    try {
        const outcome = await deleteGalleryImageCore(productId, imageUrl, imageIndex);
        return res.status(outcome.status).json(outcome.body);
    } catch (error) {
        console.error('Delete gallery image error:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/** Primary endpoint — same style as deleteProducts */
router.post('/deleteGalleryImage', async (req, res) => {
    req.params = { id: req.body?.productId };
    return deleteGalleryImageHandler(req, res);
});

router.post('/products/:id/delete-gallery-image', deleteGalleryImageHandler);
router.delete('/products/:id/gallery-image', deleteGalleryImageHandler);

/** Delete Products */
router.post('/deleteProducts', async (req, res) => {
    const { ids } = req.body;
    try {
        const products = await Products.find({ _id: { $in: ids } });
        if (!products || products.length === 0) {
            return res.status(404).json({ message: "Product doesn't exists", result: [], success: false });
        }

        const isImageUsedByOtherProductsForDelete = async (imagePath, excludeIds) => {
            const refs = getImageReferences(imagePath);
            if (refs.length === 0) {
                return false;
            }

            const product = await Products.findOne({
                _id: { $nin: excludeIds },
                $or: [{ images: { $in: refs } }, { gallery: { $in: refs } }],
            });
            return !!product;
        };

        for (const product of products) {
            if (product.images) {
                const isUsed = await isImageUsedByOtherProductsForDelete(product.images, ids);
                if (!isUsed) {
                    await deleteCloudinaryAsset(product.images);
                }
            }

            if (product.gallery?.length > 0) {
                for (const galleryImage of product.gallery) {
                    const isUsed = await isImageUsedByOtherProductsForDelete(galleryImage, ids);
                    if (!isUsed) {
                        await deleteCloudinaryAsset(galleryImage);
                    }
                }
            }
        }

        await Products.deleteMany({ _id: { $in: ids } });
        return res.status(200).json({ code: 200, success: true, message: 'Product Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

/* get all products */
router.get('/getProducts', async (req, res) => {
    try {
        const products = await Products.find().populate('category').populate('gender');
        const withoutCategory = products.filter((item) => item.category == null);
        if (withoutCategory.length > 0) {
            const idsToDelete = withoutCategory.map((item) => item._id);
            await Products.deleteMany({ _id: { $in: idsToDelete } });
        }

        const cleanProducts = await Products.find().populate('category').populate('gender');
        return res.status(200).json({ result: cleanProducts, code: 200, success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.get('/getByIDProducts/:id', async (req, res) => {
    const prodID = req.params.id;
    try {
        const products = await Products.findById(prodID);
        if (products.images) {
            products.images = resolveProductImageUrl(products.images, req);
        }

        if (products.gallery && Array.isArray(products.gallery)) {
            products.gallery = products.gallery.map((img) => resolveProductImageUrl(img, req));
        }

        return res.status(200).json({ result: products, code: 200, success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.get('/colors', async (req, res) => {
    try {
        const response = await axios.get('https://csscolorsapi.com/api/colors');
        return res.status(200).json({ result: response.data.colors, code: 200, success: true });
    } catch (err) {
        return res.status(err.response?.status || 500).json({ message: err.message });
    }
});

async function generateSku(prefix = 'SKU') {
    const hash = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${hash}`;
}

module.exports = router;
