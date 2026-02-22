const express = require('express')
const cookiesParser = require('cookie-parser')
const sellerRouter = require('./routes/seller.routes')

const app = express()
app.use(cookiesParser())



app.use('/api/seller/deshboard', sellerRouter)


module.exports = app
