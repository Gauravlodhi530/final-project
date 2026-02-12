const OrderModel = require("../models/order.model");
const axios = require("axios");

async function createOrder(req, res) {
  const user = req.user;
  const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];

  try {
    const cartResponse = await axios.get("http://localhost:3002/api/cart", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("Cart Data:", cartResponse.data.cart.items);
    const products = await Promise.all(
      cartResponse.data.cart.items.map(async (item) => {
        try {
          const response = await axios.get(
            `http://localhost:3001/api/products/${item.productId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          return response.data.product;
        } catch (error) {
          console.error(
            `Error fetching product ${item.productId}:`,
            error.message,
          );
          return null; // or throw new Error(`Product ${item.productId} not found`);
        }
      }),
    );

    let priceAmount = 0;
    const orderItems = cartResponse.data.cart.items.map((item, index) => {
      const product = products[index]; // since products are in same order
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      if (product.stock < item.qty) {
        throw new Error(
          `Product ${product.title} is not in stock or has insufficient quantity`,
        );
      }

      const itemTotal = product.price.amount * item.qty;
      priceAmount += itemTotal;
      return {
        product: item.productId,
        quantity: item.qty,
        price: {
          amount: product.price.amount,
          currency: product.price.currency,
        },
      };
    });

    const orderData = await OrderModel.create({
      user: user.id,
      items: orderItems,
      totalPrice: { amount: priceAmount, currency: "INR" },
      status: "pending",

      shippingAddress: req.body.shippingAddress,
    });

    res
      .status(201)
      .json({ message: "Order created successfully", order: orderData });
  } catch (error) {
    console.log(error);

    console.error("Error fetching cart data:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function getMYOrders(req, res) {
  const user = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  try {
    const orders = await OrderModel.find({ user: user.id })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalOrders = await OrderModel.countDocuments({ user: user.id });

    res.status(200).json({
      success: true,
      orders,
      totalOrders,
      page,
      limit,
    });


  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getOrderById(req, res) {
  try {
    const user = req.user;
    const orderID = req.params.id;
    const order = await OrderModel.findOne({ _id: orderID });
    
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }
    if (order.user.toString() !== user.id) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;
    const { status } = req.body;

    // Only allow user to cancel their own pending orders
    const order = await OrderModel.findOne({
      _id: id,
      user: user.id,
      status: "pending",
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found or cannot be updated",
      });
    }

    if (status !== "cancelled") {
      return res
        .status(400)
        .json({ success: false, error: "Invalid status update" });
    }

    order.status = status;
    await order.save();

    res
      .status(200)
      .json({ success: true, message: "Order updated successfully", order });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getSellerOrders(req, res) {
  try {
    const orders = await OrderModel.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function cancelOrder(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const order = await OrderModel.findOne({
      _id: id,
      user: user.id,
      status: "pending",
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found or cannot be cancelled",
      });
    }

    order.status = "cancelled";
    await order.save();

    res
      .status(200)
      .json({ success: true, message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateOrderAddress(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;
    const { shippingAddress } = req.body;

    const order = await OrderModel.findOne({
      _id: id,
      user: user.id,
      status: "pending",
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found or cannot be updated",
      });
    }

    order.shippingAddress = shippingAddress;
    await order.save();

    res
      .status(200)
      .json({ success: true, message: "Order address updated successfully", order });
  } catch (error) {
    console.error("Error updating order address:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  createOrder,
  getMYOrders,
  getOrderById,
  updateOrderStatus,
  getSellerOrders,
  cancelOrder,
  updateOrderAddress,
};
