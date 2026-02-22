const express = require("express");
const createAuthMiddleware = require("../middlewares/auth.middleware");
const router = express.Router();
const controller = require("../controllers/seller.controller");

router.get("/matrics", createAuthMiddleware(["seller"]), controller.getMatrics);
router.get("/sales", createAuthMiddleware(["seller"]), controller.getSales);
router.get("/revenue", createAuthMiddleware(["seller"]), controller.getRevenue);
router.get("/top-products", createAuthMiddleware(["seller"]), controller.getTopProducts);
router.get("/orders", createAuthMiddleware(["seller"]), controller.getOrders);
router.get("/products", createAuthMiddleware(["seller"]), controller.getProducts);

module.exports = router;
