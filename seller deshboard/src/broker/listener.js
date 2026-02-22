const { subscribeToQueue } = require("./broker");
const userModel = require("../models/user.model");
const productModel = require("../models/product.model");
const orderModel = require("../models/order.model");
const paymentModel = require("../models/payment.model");

module.exports = async function () {
  subscribeToQueue("AUTH_SELLER_DESHBOARD.USER_CREATED", async (user) => {
    await userModel.create(user);
  });

  subscribeToQueue("AUTH_SELLER_DESHBOARD.USER_UPDATED", async (product) => {
    await productModel.create(product);
  });

  subscribeToQueue("ORDER_SELLER_DESHBOARD.ORDER_CREATED", async (order) => {
    await orderModel.create(order);
  });

  subscribeToQueue(
    "PAYMENT_SELLER_DESHBOARD.PAYMENT_CREATED",
    async (payment) => {
      await paymentModel.create(payment);
    },
  );

  subscribeToQueue(
    "PAYMENT_SELLER_DESHBOARD.PAYMENT_UPDATED",
    async (payment) => {
      await paymentModel.findOneAndUpdate(
        { orderId: payment.orderId },
        {...payment},
      );
    },
  );
};
