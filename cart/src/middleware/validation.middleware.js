const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");

function validateCartItem(req, res, next) {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ success: false, errors: error.array() });
  }
  next();
}

const validateAddaItemToCart = [
  body("productId")
    .isString()
    .withMessage("productId must be a string")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid productId format"),
  body("qty")
    .isInt({ gt: 0 })
    .withMessage("qty must be an integer greater than 0"),
  validateCartItem,
];

module.exports = {
  validateAddaItemToCart,
};
