const express = require('express');
const cookieParser = require('cookie-parser')
const app = express();
const orderRoutes = require('./routes/order.routes');


app.use(express.json());
app.use(cookieParser());



app.use('/api/order', orderRoutes);



module.exports = app;