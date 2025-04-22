const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'Category is required'] },
    gender: { type: mongoose.Schema.Types.ObjectId, ref: 'Gender', required: [true, 'Gender is required'] },
    productName: {
        type: String,
        required: true,
    },
    productDescription: String,
    imageUrl: { type: String, required: true },
    imageName: { type: String, required: true },
    imageType: { type: String, required: true },
    price: {
        type: Number,
        required: true,
    },
    discountPrice: Number,
    slug: { type: String, unique: true },
    gallery: {
        type: [
            {
                imageUrl: { type: String, required: true },
                imageName: { type: String, required: true },
                imageType: { type: String, required: true }
            }
        ],
        required: [true, 'Gallery is required'],
        validate: {
            validator: function (value) {
                return Array.isArray(value) && value.length > 0;
            },
            message: 'At least one image in the gallery is required'
        }
    },
    brand: String,
    sizes: {
        type: [String],
        required: [true, 'Sizes are required'],
        validate: {
            validator: function (value) {
                return value.length > 0;
            },
            message: 'At least one size is required'
        }
    },
    colors: {
        type: [String],
        required: [true, 'Colors are required'],
        validate: {
            validator: function (value) {
                return value.length > 0;
            },
            message: 'At least one color is required'
        }
    },
    tags: [String],
    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },
    stock: { type: Number, default: 0, required: true, },
    inStock: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false }, //Highlight for Home Page
});

module.exports = mongoose.model('products', productSchema)

// {
//     "productName": "Batman Oversized T-Shirt",
//     "productDescription": "Comfortable oversized Batman themed t-shirt made from premium cotton.",
//     "price": 699,
//     "discountPrice": 599,
//     "imageUrl": "/uploads/batman_main.jpg",
//     "imageName": "batman_main.jpg",
//     "imageType": "image/jpeg",
//     "gallery": [
//       {
//         "imageUrl": "/uploads/batman_side1.jpg",
//         "imageName": "batman_side1.jpg",
//         "imageType": "image/jpeg"
//       },
//       {
//         "imageUrl": "/uploads/batman_side2.jpg",
//         "imageName": "batman_side2.jpg",
//         "imageType": "image/jpeg"
//       }
//     ],
//     "sizes": [
//       "S",
//       "M",
//       "L",
//       "XL"
//     ],
//     "colors": [
//       "Black"
//     ],
//     "tags": [
//       "batman",
//       "oversized",
//       "tshirt",
//       "superhero"
//     ],
//     "stock": 50,
//     "inStock": true,
//     "category": "66169260e1234567890abcde"
//   }