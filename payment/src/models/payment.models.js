const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    productId: {
      type: String,
    },
    orderId: {
      type: String,
      required: true,
    },
    razorpayOrderId: {
      type: String,
    },
    signature: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    price:{
      amount:{
        type: Number,
        required: true,
      },
      currency:{
        type: String,
        required: true,
        default: "INR", enum: ["INR", "USD"],
      }
    }
  },
  { timestamps: true },
);


const paymentModel = mongoose.model("Payment", paymentSchema);

module.exports = paymentModel;