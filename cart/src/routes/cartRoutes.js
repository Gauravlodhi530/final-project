const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const cartController = require("../controllers/cartController");
const validation = require("../middleware/validation.middleware");

// GET /api/cart - Fetch current cart
router.get("/", authMiddleware(["user"]), cartController.getCart);

// POST /api/cart/items - Add item to cart
router.post(
  "/items",
  validation.validateAddaItemToCart,
  authMiddleware(["user"]),
  cartController.addItemToCart,
);

// PATCH /api/cart/items/:productId - Update item quantity
router.patch(
  "/items/:productId",
  authMiddleware(["user"]),
  cartController.updateItemQuantity,
);

// DELETE /api/cart/items/:productId - Remove item from cart
router.delete(
  "/items/:productId",
  authMiddleware(["user"]),
  cartController.removeItemFromCart,
);

// DELETE /api/cart - Clear entire cart
router.delete("/", authMiddleware(["user"]), cartController.clearCart);
module.exports = router;
