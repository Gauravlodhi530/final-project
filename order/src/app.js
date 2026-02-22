const express = require('express');
const cookieParser = require('cookie-parser')
const app = express();
const orderRoutes = require('./routes/order.routes');


app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/', (req, res) => {
    res.send('Order Service');
});

app.use('/api/order', orderRoutes);



module.exports = app;