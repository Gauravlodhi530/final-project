const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const axios = require("axios");

const searchProduct = tool(
  async ({ query, token }) => {

    
    const response = await axios.get(
      `http://localhost:3001/api/products?q=${query}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.stringify(response.data);
  },
  {
    name: "searchProduct",
    description: "Search for products based on a query",
    schema: z.object({
      query: z.string().describe("The search query for products"),
      token: z.string().describe("The authentication token"),
    }),
  },
);

const addProductToCart = tool(
  async ({ productId, qty = 1, token }) => {
    const response = await axios.post(
      `http://localhost:3002/api/cart/items`,
      {
        productId: productId,
        quantity: qty,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return ' Added product with ID ' + productId + ' to cart with quantity ' + qty;
  },
  {
    name: "addProductToCart",
    description: "Add a product to the shopping cart",
    schema: z.object({
      productId: z
        .string()
        .describe("The ID of the product to add to the cart"),
      qty: z
        .number()
        .optional()
        .describe("The quantity of the product to add (default is 1)"),
      token: z.string().describe("The authentication token"),
    }),
  },
);


module.exports = { searchProduct, addProductToCart };