const express =  require('express')
const authMiddleware = require('../middlewares/auth.middleware')
const orderController = require('../controller/order.controller')
const validation = require("../middlewares/vailidator.middleware")


const router =  express.Router()

router.post('/', authMiddleware(['user']), validation.createOrderValidator, orderController.createOrder)

router.get('/me', authMiddleware(['user']), orderController.getMYOrders)

router.get('/seller', authMiddleware(['user']), orderController.getSellerOrders)

router.get('/:id', authMiddleware(['user', "admin"]), orderController.getOrderById)

router.put('/:id/status', authMiddleware(['user']), validation.updateOrderStatusValidator, orderController.updateOrderStatus)

router.post('/:id/cancel', authMiddleware(['user']), orderController.cancelOrder)

router.post('/:id/address', authMiddleware(['user']), validation.updateAddressValidator, orderController.updateOrderAddress)






module.exports = router