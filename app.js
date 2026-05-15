require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const cloudinary = require('./utils/cloudinary');

// Import Routes (after dotenv so Cloudinary credentials are available)
const routes = require('./routes/auth');
const caregoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const usersRoutes = require('./routes/userMangement');
const cartRoutes = require('./routes/cart');
const wishListRoutes = require('./routes/wishlistRoutes');
const orderListRoutes = require('./routes/orderManagementRoutes');
const productVariantRoutes = require('./routes/productVariantRoutes');
const wareHouseRoutes = require('./routes/warehouseRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseOrderRouted = require('./routes/purchaseOrderRoutes');
const notifyRouted = require('./routes/NotifyRoutes');
const deliveryAddressRoutes = require('./routes/deliveryAddressRoutes');

if (!process.env.CLOUD_NAME || !process.env.API_KEY || !process.env.API_SECRET) {
    console.error('Missing Cloudinary env vars: CLOUD_NAME, API_KEY, API_SECRET');
} else if (!cloudinary.config().cloud_name) {
    console.error('Cloudinary failed to initialize. Check your .env file.');
} else {
    console.log(`Cloudinary ready (cloud: ${cloudinary.config().cloud_name})`);
}

const app = express();
connectDB();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

app.get('/api/health/upload', (req, res) => {
    const config = cloudinary.config();
    res.json({
        storage: 'cloudinary',
        cloudName: config.cloud_name || null,
        configured: Boolean(config.cloud_name && config.api_key && config.api_secret),
    });
});

// Routes
app.use('/api', routes);
app.use('/api', caregoryRoutes);
app.use('/api', productRoutes);
app.use('/api', usersRoutes);
app.use('/api', cartRoutes);
app.use('/api', wishListRoutes);
app.use('/api', orderListRoutes);
app.use('/api', productVariantRoutes);
app.use('/api', wareHouseRoutes);
app.use('/api', supplierRoutes);
app.use('/api', purchaseOrderRouted);
app.use('/api', notifyRouted);
app.use('/api', deliveryAddressRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
