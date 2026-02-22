const express = require("express");
const cartRoutes = require("./routes/cartRoutes");
const cookieParser = require('cookie-parser');


const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
    res.send('Cart Service');
});

// Routes
app.use("/api/cart", cartRoutes);

module.exports = app;
