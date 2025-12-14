// routes/product.route.js
const express = require("express");
const productController = require("../controller/product.controller");
const createAuthMiddleware = require("../middleware/auth.middleware");
const { validateCreateProduct } = require("../validators/product.validator");
const { uploadImages, handleUploadError } = require("../services/upload.service");

const router = express.Router();

// Routes
// POST /api/products
router.post(
  "/",
  createAuthMiddleware(["admin", "seller"]),
  uploadImages,
  handleUploadError,
  validateCreateProduct,
  productController.createProduct
);
// GET /api/products
router.get("/", productController.getProducts);



//PATCH /products/:id
router.patch("/:id", createAuthMiddleware(["seller"]), productController.updateProduct);

// DELETE /api/products/:id
router.delete("/:id", createAuthMiddleware(["seller"]), productController.deleteProduct);

// GET /api/products/seller
router.get("/seller", createAuthMiddleware(["seller"]), productController.getProductsBySeller);

//Get /api/products/:id
router.get("/:id", productController.getProductById);

module.exports = router;
