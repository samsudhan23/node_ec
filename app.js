const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser')
const dotenv = require("dotenv");
const connectDB = require('./config/db')

// Import Routes
const routes = require('./routes/auth');
const caregoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');

dotenv.config();
const app = express();
connectDB();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());


// Routes
app.use('/api', routes);
app.use('/api', caregoryRoutes);
app.use('/api',productRoutes);

// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

