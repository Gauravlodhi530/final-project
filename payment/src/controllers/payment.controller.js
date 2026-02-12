const axios = require("axios");
const paymentModel = require("../models/payment.models");

require("dotenv").config();
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createPayment(req, res) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  try {
    const orderId = req.params.orderId;
    const orderResponce = await axios.get(
      `http://localhost:3003/api/order/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const price = orderResponce.data.order.totalPrice.amount * 100; // Convert to paise for Razorpay

    const order = await razorpay.orders.create({ amount: price });

    const payment = await paymentModel.create({
      orderId,
      razorpayOrderId: order.id,
      user: req.user.id,
      price: {
        amount: price,
        currency: "INR",
      },
      status: "pending",
    });

    return res.status(201).json({ message: "payment initiated", payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating payment" });
  }
}

async function verifyPayment(req, res) {
  const { razorpayOrderId, razorpayPaymentId, signature } = req.body;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  try {
    const {
      validatePaymentVerification,
    } = require("../../node_modules/razorpay/dist/utils/razorpay-utils");

    const isValid = validatePaymentVerification({
      order_id: razorpayOrderId,
      payment_id: razorpayPaymentId,
      signature,
      secret,
    });
    if (!isValid) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }
    const payment = await paymentModel.findOne({
      razorpayOrderId,
      status: "pending",
    });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.paymentId = payment._id;
    payment.signature = signature;
    payment.status = "completed";
    await payment.save();

    return res.status(200).json({ message: "Payment completed", payment });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error verifying payment" });
  }
}

module.exports = { createPayment, verifyPayment };
