const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser')
const dotenv = require("dotenv");
const connectDB = require('./config/db')
const routes = require('./routes/auth')

dotenv.config();
const app = express();
connectDB();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

app.use('/api', routes);
// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

