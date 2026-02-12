const { body, validationResult } = require("express-validator");


const respondwithquickvalidationerrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const createOrderValidator = [
  body("shippingAddress.street")
    .isString()
    .withMessage("street must a string")
    .notEmpty()
    .withMessage("street is reruied"),
  body("shippingAddress.city")
    .isString()
    .withMessage("city must a string")
    .notEmpty()
    .withMessage("city is reruied"),
  body("shippingAddress.state")
    .isString()
    .withMessage("state must a string")
    .notEmpty()
    .withMessage("state is reruied"),
  body("shippingAddress.pincode")
    .isString()
    .withMessage("pincode must a string")
    .notEmpty()
    .withMessage("pincde is reruied"),
  body("shippingAddress.country")
    .isString()
    .withMessage("country must a string")
    .notEmpty()
    .withMessage("country is reruied"),
  respondwithquickvalidationerrors,
];

const updateOrderStatusValidator = [
  body("status").isIn(["cancelled"]).withMessage("Status must be cancelled"),
  respondwithquickvalidationerrors,
];

const updateAddressValidator = [
  body("shippingAddress.street")
    .isString()
    .withMessage("street must a string")
    .notEmpty()
    .withMessage("street is required"),
  body("shippingAddress.city")
    .isString()
    .withMessage("city must a string")
    .notEmpty()
    .withMessage("city is required"),
  body("shippingAddress.state")
    .isString()
    .withMessage("state must a string")
    .notEmpty()
    .withMessage("state is required"),
  body("shippingAddress.pincode")
    .isString()
    .withMessage("pincode must a string")
    .notEmpty()
    .withMessage("pincode is required"),
  body("shippingAddress.country")
    .isString()
    .withMessage("country must a string")
    .notEmpty()
    .withMessage("country is required"),
  respondwithquickvalidationerrors,
];

module.exports = {
  createOrderValidator,
  updateOrderStatusValidator,
  updateAddressValidator,
};
