require("dotenv").config();
const crypto = require("crypto");

const orderId = "order_SI1kOTwQhFmrWO";
const paymentId = "pay_SI1lnyMn8sr2E0";
const secret = process.env.RAZORPAY_KEY_SECRET;

const signature = crypto
  .createHmac("sha256", secret)
  .update(orderId + "|" + paymentId)
  .digest("hex");

console.log("Generated Signature:", signature);