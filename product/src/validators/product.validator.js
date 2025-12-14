// validators/product.validator.js
const { body, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    let message = "Validation error";
    if (errorMessages.includes('required')) {
      message = errorMessages;
    } else if (errorMessages.includes('Invalid price format')) {
      message = errorMessages;
    }
    return res.status(400).json({
      success: false,
      message: message,
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// Validation rules for createProduct
const validateCreateProduct = [
  body("title")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),
  body("description")
    .isString()
    .withMessage("Description must be a string")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .custom((value) => {
      let parsedPrice = value;
      
      // Try to parse JSON string (from multipart/form-data)
      if (typeof value === 'string') {
        try {
          parsedPrice = JSON.parse(value);
        } catch (e) {
          // If it's not valid JSON, check if it's a number string
          if (isNaN(Number(value))) {
            throw new Error("Invalid price format");
          }
          // It's a valid number string, use it as is
          parsedPrice = value;
        }
      }
      
      // Handle both object format { amount, currency } and number/string format
      if (typeof parsedPrice === 'object' && parsedPrice !== null) {
        if (typeof parsedPrice.amount === 'undefined' || parsedPrice.amount === null) {
          throw new Error("Price amount is required");
        }
        if (isNaN(Number(parsedPrice.amount)) || Number(parsedPrice.amount) < 0) {
          throw new Error("Price amount must be a positive number");
        }
        if (parsedPrice.currency && !['USD', 'INR'].includes(parsedPrice.currency)) {
          throw new Error("Price currency must be USD or INR");
        }
        return true;
      }
      // Handle number or string number
      if (isNaN(Number(parsedPrice)) || Number(parsedPrice) < 0) {
        throw new Error("Price must be a positive number");
      }
      return true;
    }),
  body("priceCurrency")
    .optional()
    .trim()
    .isIn(['USD', 'INR'])
    .withMessage("Price currency must be USD or INR"),
  handleValidationErrors,
];


module.exports = {
  validateCreateProduct,

};
