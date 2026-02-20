require("dotenv").config();
const axios = require("axios");
const paymentModel = require("../models/payment.models");
const Razorpay = require("razorpay");
const { publishToQueue } = require('../broker/broker')



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
  const { razorpayOrderId, paymentId, signature } = req.body;
  if (!razorpayOrderId || !paymentId || !signature) {
    return res.status(400).json({ message: "Missing required fields: razorpayOrderId, paymentId, signature" });
  }
  const secret = process.env.RAZORPAY_KEY_SECRET;

  try {
    const {
      validatePaymentVerification,
    } = require("../../node_modules/razorpay/dist/utils/razorpay-utils");

    
    const isValid = validatePaymentVerification(
      { order_id: razorpayOrderId, payment_id: paymentId },
      signature,
      secret
    );
    
    console.log(secret);
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

    await publishToQueue("PAYMENT_NOTIFICATION.PAYMENT_COMPLETED", {
      email: req.user.email,
      orderId: payment.order,
      paymentId: payment._id,
      userId: payment.user,
      price: payment.price,
      currency: payment.price.currency,
      fullName: req.user.fullName,
    });

    return res.status(200).json({ message: "Payment completed", payment });

  } catch (error) {
    console.error("Payment verification error:", error.message, error);

    try {
      await publishToQueue("PAYMENT_NOTIFICATION.PAYMENT_FAILED", {
        email: req.user.email,
        orderId: razorpayOrderId,
        paymentId: paymentId,
        userId: req.user.id,
        price: null,
      });
    } catch (queueError) {
      console.error("Failed to publish payment failure notification:", queueError);
    }

    res.status(500).json({ message: "Error verifying payment", error: error.message });
  }
}

module.exports = { createPayment, verifyPayment };
