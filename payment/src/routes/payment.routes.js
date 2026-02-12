const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware')

const paymentController = require('../controllers/payment.controller')





const router = express.Router()

router.post('/create/:orderId', authMiddleware(['user']), paymentController.createPayment)  
 
router.post('/verify', authMiddleware(['user']), paymentController.verifyPayment)

module.exports = router