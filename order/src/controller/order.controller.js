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
    const product = await Promise.all(cartResponse.data.cart.items.map(async(item) => {
      return (await axios.get(`http://localhost:3001/api/products/${item.productId}`,{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })).data;
    }));

    console.log("Product Data:", product);


  } catch (error) {
    console.log(error);

    console.error("Error fetching cart data:", error);
  }
}

module.exports = {
  createOrder,
};
