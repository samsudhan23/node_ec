const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser')
const dotenv = require("dotenv");
const connectDB = require('./config/db')
const path = require("path");


// Import Routes
const routes = require('./routes/auth');
const caregoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const usersRoutes = require('./routes/userMangement');
const cartRoutes = require('./routes/cart');

dotenv.config();
const app = express();
connectDB();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// Image decleare statically
const folderLocation = path.join(__dirname, "assets/Products");
app.use("/assets/Products", express.static(folderLocation))

// Routes
app.use('/api', routes);
app.use('/api', caregoryRoutes);
app.use('/api', productRoutes);
app.use('/api', usersRoutes);
app.use('/api', cartRoutes);

// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

