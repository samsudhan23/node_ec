const path = require('path');
const fs = require('fs');
const cloudinary = require('./cloudinary');
const Products = require('../model/ProductModel');

const LEGACY_PRODUCTS_PATH = '/assets/Products/';

const isCloudinaryUrl = (url) =>
    typeof url === 'string' && url.includes('res.cloudinary.com');

const isLocalhostAssetUrl = (url) =>
    typeof url === 'string' &&
    (url.includes('localhost') || url.includes('/assets/Products/'));

/** multer-storage-cloudinary sets path = secure_url, filename = public_id */
const getFileUrl = (file) => {
    if (!file) {
        return null;
    }
    if (file.path && file.path.startsWith('http')) {
        return file.path;
    }
    if (file.secure_url) {
        return file.secure_url;
    }
    console.error('Upload file missing Cloudinary URL. Keys:', Object.keys(file), file);
    return null;
};

const extractPublicId = (imageUrl) => {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
        return null;
    }

    try {
        const withoutQuery = imageUrl.split('?')[0];
        const uploadIndex = withoutQuery.indexOf('/upload/');
        if (uploadIndex === -1) {
            return null;
        }

        let remainder = withoutQuery.slice(uploadIndex + '/upload/'.length);
        if (remainder.startsWith('v') && /^v\d+\//.test(remainder)) {
            remainder = remainder.replace(/^v\d+\//, '');
        }

        return remainder.replace(/\.[^/.]+$/, '');
    } catch {
        return null;
    }
};

const getImageReferences = (imagePath) => {
    if (!imagePath) {
        return [];
    }

    const refs = new Set([imagePath]);

    if (imagePath.includes('http')) {
        refs.add(imagePath.split('/').pop());
        const publicId = extractPublicId(imagePath);
        if (publicId) {
            refs.add(publicId);
        }
    }

    return [...refs];
};

const resolveProductImageUrl = (img, req) => {
    if (!img) {
        return img;
    }
    if (img.startsWith('http')) {
        return img;
    }

    if (process.env.LEGACY_ASSETS_BASE_URL) {
        return `${process.env.LEGACY_ASSETS_BASE_URL.replace(/\/$/, '')}/${img.replace(/^\//, '')}`;
    }

    return img;
};

const applyProductUploads = (req, target = req.body) => {
    if (req.files?.images?.[0]) {
        const imageUrl = getFileUrl(req.files.images[0]);
        if (!imageUrl) {
            throw new Error('Main image upload failed. Cloudinary did not return a URL.');
        }
        target.images = imageUrl;
    }

    if (req.files?.gallery?.length) {
        const galleryUrls = req.files.gallery.map(getFileUrl);
        if (galleryUrls.some((url) => !url)) {
            throw new Error('Gallery upload failed. Cloudinary did not return a URL.');
        }
        target.gallery = galleryUrls;
    }

    return target;
};

const stripInvalidImageFields = (body) => {
    if (body.images && !isCloudinaryUrl(body.images)) {
        delete body.images;
    }
    if (Array.isArray(body.gallery)) {
        body.gallery = body.gallery.filter(isCloudinaryUrl);
    }
};

const deleteUploadedFiles = async (files) => {
    if (!files) {
        return;
    }

    const publicIds = [];
    ['images', 'gallery'].forEach((key) => {
        if (files[key]) {
            files[key].forEach((file) => {
                if (file.filename) {
                    publicIds.push(file.filename);
                }
            });
        }
    });

    await Promise.all(
        publicIds.map((publicId) =>
            cloudinary.uploader.destroy(publicId, { invalidate: true }).catch(() => null)
        )
    );
};

const deleteCloudinaryAsset = async (imagePath) => {
    if (!imagePath) {
        return;
    }

    if (imagePath.includes('cloudinary.com')) {
        const publicId = extractPublicId(imagePath);
        if (publicId) {
            await cloudinary.uploader.destroy(publicId, { invalidate: true }).catch(() => null);
        }
        return;
    }

    const fileName = imagePath.includes('http')
        ? imagePath.split('/').pop()
        : imagePath.replace(/^.*\/assets\/Products\//, '');

    const localPath = path.join(__dirname, '../assets/Products', fileName);
    if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
    }
};

const isImageUsedByOtherProducts = async (imagePath, excludeId = null) => {
    const refs = getImageReferences(imagePath);
    if (refs.length === 0) {
        return false;
    }

    const query = {
        $or: [{ images: { $in: refs } }, { gallery: { $in: refs } }],
    };

    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    const product = await Products.findOne(query);
    return !!product;
};

module.exports = {
    getFileUrl,
    isCloudinaryUrl,
    isLocalhostAssetUrl,
    extractPublicId,
    getImageReferences,
    resolveProductImageUrl,
    applyProductUploads,
    stripInvalidImageFields,
    deleteUploadedFiles,
    deleteCloudinaryAsset,
    isImageUsedByOtherProducts,
    LEGACY_PRODUCTS_PATH,
};
