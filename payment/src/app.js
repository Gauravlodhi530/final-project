const cookieParser = require("cookie-parser");
const express = require("express");
const paymentRoutes = require("./routes/payment.routes");



const app = express();

app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/', (req, res) => {
    res.send('Payment Service');
});

app.use("/api/payment", paymentRoutes);


module.exports = app;
