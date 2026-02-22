const express = require('express');
const cookieParser = require('cookie-parser')
const { setupMiddleware } = require('./setup/middleware')
const productRoutes = require('./routes/product.routes')

const app = express()
app.use(express.json())
app.use(cookieParser())

// Setup middleware
setupMiddleware(app)

// Health check
app.get('/', (req, res) => {
    res.send('Product Service');
});

// Routes
app.use('/api/products', productRoutes)

module.exports = app