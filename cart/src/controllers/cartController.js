const cartModel = require('../models/cart.model');


// Cart Controller
let cart = {};

// Reset cart (for testing)
const resetCart = () => {
  cart = {};
};

// GET /cart - Fetch current cart
const getCart = (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: cart,
      message: 'Cart retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// POST /cart/items - Add item to cart
async function addItemToCart(req, res) {
  try {
    const { productId, qty } = req.body;

    const user = req.user;
     
    let cart = await cartModel.findOne({ user: user._id });
    if (!cart) {
      cart = new cartModel({ user: user._id, items: [] });
    }
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].qty += qty;
    } else {
      cart.items.push({ productId, qty });
    }
    await cart.save();

   

    res.status(201).json({
      success: true,
      cart,
      message: 'Item added to cart'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// PATCH /cart/items/:productId - Update item quantity
const updateItemQuantity = (req, res) => {
  try {
    const { productId } = req.params;
    const { qty } = req.body;

    if (!cart[productId]) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    if (qty === undefined) {
      return res.status(400).json({
        success: false,
        message: 'qty is required'
      });
    }

    if (qty <= 0) {
      delete cart[productId];
      return res.status(200).json({
        success: true,
        message: 'Item removed from cart'
      });
    }

    cart[productId].qty = qty;

    res.status(200).json({
      success: true,
      data: cart[productId],
      message: 'Item quantity updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE /cart/items/:productId - Remove item from cart
const removeItemFromCart = (req, res) => {
  try {
    const { productId } = req.params;

    if (!cart[productId]) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    delete cart[productId];

    res.status(200).json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE /cart - Clear entire cart
const clearCart = (req, res) => {
  try {
    cart = {};

    res.status(200).json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
  resetCart
};
