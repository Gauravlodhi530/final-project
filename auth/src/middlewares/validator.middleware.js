const { body, validationResult } = require("express-validator");
const { model } = require("mongoose");

const respondwithquickvalidationerrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const registerUserValidations = [
  body("userName")
    .isString()
    .withMessage("userName must be a string")
    .isLength({ min: 2, max: 100 })
    .withMessage("userName must be between 2 and 100 characters"),

  body("email").isEmail().withMessage("Invalid email format"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  body("fullName.firstName")
    .isString()
    .withMessage("firstName must be a string")
    .isLength({ min: 2, max: 100 })
    .withMessage("firstName must be between 2 and 100 characters"),

  body("fullName.lastName")
    .isString()
    .withMessage("lastName must be a string")
    .isLength({ min: 2, max: 100 })
    .withMessage("lastName must be between 2 and 100 characters"),

  body("role")
    .optional()
    .isIn(["user", "seller"])
    .withMessage("role must be either 'user' or 'seller'"),

  respondwithquickvalidationerrors,
];

const loginUserValidations = [
  body("email").optional().isEmail().withMessage("Invalid email format"),

  body("username")
    .optional()
    .isString()
    .withMessage("username must be a string"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  (req, res, next) => {
    if (!req.body.email && !req.body.username) {
      return res.status(400).json({ message: "Email or username is required" });
    }
    next();
  },

  respondwithquickvalidationerrors,
];

const addUserAddressValidations = [
  body("street")
    .isString()
    .withMessage("street must a string")
    .notEmpty()
    .withMessage("street is reruied"),
  body("city")
    .isString()
    .withMessage("city must a string")
    .notEmpty()
    .withMessage("city is reruied"),
  body("state")
    .isString()
    .withMessage("state must a string")
    .notEmpty()
    .withMessage("state is reruied"),
  body("pincode")
    .isString()
    .withMessage("pincode must a string")
    .notEmpty()
    .withMessage("pincde is reruied"),
  body("country")
    .isString()
    .withMessage("country must a string")
    .notEmpty()
    .withMessage("country is reruied"),
  body("isDefault").optional().isBoolean().withMessage("must be boolean"),
  respondwithquickvalidationerrors,
];

module.exports = {
  registerUserValidations,
  loginUserValidations,
  addUserAddressValidations,
};
