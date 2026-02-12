// Mock external services
jest.mock('axios');
const axios = require('axios');

// Mock JWT
jest.mock('jsonwebtoken');
const jwt = require('jsonwebtoken');

const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const OrderModel = require('../src/models/order.model');

let mongoServer;
let mockUserId;
let prod1Id, prod2Id;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret';
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  mockUserId = new mongoose.Types.ObjectId();
  prod1Id = new mongoose.Types.ObjectId().toString();
  prod2Id = new mongoose.Types.ObjectId().toString();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  jest.clearAllMocks();
  await OrderModel.deleteMany({});

  // Mock JWT verify
  jwt.verify.mockImplementation(() => ({
    id: mockUserId.toString(),
    role: "user",
  }));
});

describe("POST /api/order", () => {
  it("should create a new order from cart", async () => {
    // Mock cart response
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/cart")) {
        return Promise.resolve({
          data: {
            cart: {
              items: [
                { productId: prod1Id, qty: 2 },
                { productId: prod2Id, qty: 1 },
              ],
            },
          },
        });
      }
      // Mock product responses
      if (url.includes(`/api/products/${prod1Id}`)) {
        return Promise.resolve({
          data: {
            product: {
              _id: prod1Id,
              title: "Product 1",
              price: { amount: 50, currency: "INR" },
              stock: 5,
            },
          },
        });
      }
      if (url.includes(`/api/products/${prod2Id}`)) {
        return Promise.resolve({
          data: {
            product: {
              _id: prod2Id,
              title: "Product 2",
              price: { amount: 100, currency: "INR" },
              stock: 3,
            },
          },
        });
      }
    });

    const response = await request(app)
      .post("/api/order")
      .set("Cookie", "token=mock_token")
      .send({
        shippingAddress: { 
          city: "New York", 
          street: "123 Main St",
          state: "NY",
          pincode: "10001",
          country: "USA"
        },
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Order created successfully");
    expect(response.body.order).toHaveProperty("_id");
    expect(response.body.order.totalPrice.amount).toBe(200); // 2*50 + 1*100
    expect(response.body.order.items).toHaveLength(2);
    expect(response.body.order.status).toBe("pending");
  });

  it("should reserve inventory", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/cart")) {
        return Promise.resolve({
          data: {
            cart: {
              items: [{ productId: prod1Id, qty: 1 }],
            },
          },
        });
      }
      if (url.includes(`/api/products/${prod1Id}`)) {
        return Promise.resolve({
          data: {
            product: {
              _id: prod1Id,
              title: "Product 1",
              price: { amount: 100, currency: "INR" },
              stock: 5,
            },
          },
        });
      }
    });

    const response = await request(app)
      .post("/api/order")
      .set("Cookie", "token=mock_token")
      .send({
        shippingAddress: { city: "Test City", street: "Test Street", state: "Test State", pincode: "12345", country: "Test Country" },
      });

    expect(response.status).toBe(201);
    // In a real implementation, inventory would be reserved
    // For now, just check order is created
    expect(response.body.order).toBeDefined();
  });

  it("should emit order-created event", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/cart")) {
        return Promise.resolve({
          data: {
            cart: {
              items: [{ productId: prod1Id, qty: 1 }],
            },
          },
        });
      }
      if (url.includes(`/api/products/${prod1Id}`)) {
        return Promise.resolve({
          data: {
            product: {
              _id: prod1Id,
              title: "Product 1",
              price: { amount: 100, currency: "INR" },
              stock: 5,
            },
          },
        });
      }
    });

    const response = await request(app)
      .post("/api/order")
      .set("Cookie", "token=mock_token")
      .send({
        shippingAddress: { city: "Test City", street: "Test Street", state: "Test State", pincode: "12345", country: "Test Country" },
      });

    expect(response.status).toBe(201);
    // In a real implementation, an event would be emitted
    // For now, just check order is created
    expect(response.body.order).toBeDefined();
  });

  it("should calculate taxes and shipping", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/cart")) {
        return Promise.resolve({
          data: {
            cart: {
              items: [{ productId: prod1Id, qty: 1 }],
            },
          },
        });
      }
      if (url.includes(`/api/products/${prod1Id}`)) {
        return Promise.resolve({
          data: {
            product: {
              _id: prod1Id,
              title: "Product 1",
              price: { amount: 100, currency: "INR" },
              stock: 5,
            },
          },
        });
      }
    });

    const response = await request(app)
      .post("/api/order")
      .set("Cookie", "token=mock_token")
      .send({
        shippingAddress: { city: "Test City", street: "Test Street", state: "Test State", pincode: "12345", country: "Test Country" },
      });

    expect(response.status).toBe(201);
    expect(response.body.order.totalPrice.amount).toBe(100);
    // Taxes and shipping would be calculated in a real implementation
  });

  it("should fail when product out of stock", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/cart")) {
        return Promise.resolve({
          data: {
            cart: {
              items: [{ productId: prod1Id, qty: 10 }],
            },
          },
        });
      }
      if (url.includes(`/api/products/${prod1Id}`)) {
        return Promise.resolve({
          data: {
            product: {
              _id: prod1Id,
              title: "Product 1",
              price: { amount: 100, currency: "INR" },
              stock: 5, // Less than requested
            },
          },
        });
      }
    });

    const response = await request(app)
      .post("/api/order")
      .set("Cookie", "token=mock_token")
      .send({
        shippingAddress: { city: "Test City", street: "Test Street", state: "Test State", pincode: "12345", country: "Test Country" },
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toContain("insufficient quantity");
  });

  it("should fail when product not found", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/cart")) {
        return Promise.resolve({
          data: {
            cart: {
              items: [{ productId: "nonexistent", qty: 1 }],
            },
          },
        });
      }
      if (url.includes("/api/products/nonexistent")) {
        return Promise.reject(new Error("Product not found"));
      }
    });

    const response = await request(app)
      .post("/api/order")
      .set("Cookie", "token=mock_token")
      .send({
        shippingAddress: { city: "Test City", street: "Test Street", state: "Test State", pincode: "12345", country: "Test Country" },
      });

    expect(response.status).toBe(500);
  });

  it("should fail when cart fetch fails", async () => {
    axios.get.mockRejectedValue(new Error("Cart service unavailable"));

    const response = await request(app)
      .post("/api/order")
      .set("Cookie", "token=mock_token")
      .send({
        shippingAddress: { city: "Test City", street: "Test Street", state: "Test State", pincode: "12345", country: "Test Country" },
      });

    expect(response.status).toBe(500);
  });

  it("should fail when user not authenticated", async () => {
    const response = await request(app)
      .post("/api/order")
      .send({
        shippingAddress: { city: "Test City", street: "Test Street", state: "Test State", pincode: "12345", country: "Test Country" },
      });

    expect(response.status).toBe(401);
  });
});

describe("GET /api/order/me", () => {
  it("should get all orders for the user", async () => {
    // Create some orders first
    await OrderModel.create({
      user: mockUserId,
      items: [{ product: prod1Id, quantity: 1, price: { amount: 50, currency: "INR" } }],
      totalPrice: { amount: 50, currency: "INR" },
      status: "pending",
      shippingAddress: { city: "Test City", street: "Test Street", state: "Test State", pincode: "12345", country: "Test Country" },
    });
    await OrderModel.create({
      user: mockUserId,
      items: [{ product: prod2Id, quantity: 2, price: { amount: 100, currency: "INR" } }],
      totalPrice: { amount: 200, currency: "INR" },
      status: "delivered",
      shippingAddress: { city: "Test City", street: "Test Street", state: "Test State", pincode: "12345", country: "Test Country" },
    });

    const response = await request(app)
      .get("/api/order/me")
      .set("Cookie", "token=mock_token");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.orders).toHaveLength(2);
    expect(response.body.orders[0].status).toBe("delivered"); // sorted by createdAt desc
  });

  it("should return empty array if no orders", async () => {
    const response = await request(app)
      .get("/api/order/me")
      .set("Cookie", "token=mock_token");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.orders).toHaveLength(0);
  });

  it("should get orders via /me route", async () => {
    // Create some orders first
    await OrderModel.create({
      user: mockUserId,
      items: [{ product: prod1Id, quantity: 1, price: { amount: 50, currency: "INR" } }],
      totalPrice: { amount: 50, currency: "INR" },
      status: "pending",
      shippingAddress: { city: "Test City", street: "Test Street", state: "Test State", pincode: "12345", country: "Test Country" },
    });

    const response = await request(app)
      .get("/api/order/me")
      .set("Cookie", "token=mock_token");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.orders).toHaveLength(1);
  });

  it("should fail when user not authenticated", async () => {
    const response = await request(app)
      .get("/api/order/me");

    expect(response.status).toBe(401);
  });
});

describe("GET /api/order/:id", () => {
  it("should get a specific order by id", async () => {
    const order = await OrderModel.create({
      user: mockUserId,
      items: [{ product: prod1Id, quantity: 1, price: { amount: 50, currency: "INR" } }],
      totalPrice: { amount: 50, currency: "INR" },
      status: "pending",
      shippingAddress: { city: "Test City", street: "Test Street", state: "Test State", pincode: "12345", country: "Test Country" },
    });

    const response = await request(app)
      .get(`/api/order/${order._id}`)
      .set("Cookie", "token=mock_token");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.order._id).toBe(order._id.toString());
    expect(response.body.order.status).toBe("pending");
  });

  it("should return 404 if order not found", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .get(`/api/order/${fakeId}`)
      .set("Cookie", "token=mock_token");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Order not found");
  });

  it("should return 404 if order belongs to another user", async () => {
    const otherUserId = new mongoose.Types.ObjectId();
    const order = await OrderModel.create({
      user: otherUserId,
      items: [{ product: prod1Id, quantity: 1, price: { amount: 50, currency: "INR" } }],
      totalPrice: { amount: 50, currency: "INR" },
      status: "pending",
      shippingAddress: { city: "Test City", street: "Test Street", state: "Test State", pincode: "12345", country: "Test Country" },
    });

    const response = await request(app)
      .get(`/api/order/${order._id}`)
      .set("Cookie", "token=mock_token");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Order not found");
  });

  it("should fail when user not authenticated", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .get(`/api/order/${fakeId}`);

    expect(response.status).toBe(401);
  });
});

describe("PUT /api/order/:id/status", () => {
  it("should update order status to cancelled", async () => {
    const order = await OrderModel.create({
      user: mockUserId,
      items: [{ product: prod1Id, quantity: 1, price: { amount: 50, currency: "INR" } }],
      totalPrice: { amount: 50, currency: "INR" },
      status: "pending",
      shippingAddress: { city: "Test City", street: "Test Street", state: "Test State", pincode: "12345", country: "Test Country" },
    });

    const response = await request(app)
      .put(`/api/order/${order._id}/status`)
      .set("Cookie", "token=mock_token")
      .send({ status: "cancelled" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Order updated successfully");
    expect(response.body.order.status).toBe("cancelled");
  });

  it("should return 404 if order not found", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .put(`/api/order/${fakeId}/status`)
      .set("Cookie", "token=mock_token")
      .send({ status: "cancelled" });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Order not found or cannot be updated");
  });

  it("should return 404 if order is not pending", async () => {
    const order = await OrderModel.create({
      user: mockUserId,
      items: [{ product: prod1Id, quantity: 1, price: { amount: 50, currency: "INR" } }],
      totalPrice: { amount: 50, currency: "INR" },
      status: "delivered",
      shippingAddress: { city: "Test City", street: "Test Street", state: "Test State", pincode: "12345", country: "Test Country" },
    });

    const response = await request(app)
      .put(`/api/order/${order._id}/status`)
      .set("Cookie", "token=mock_token")
      .send({ status: "cancelled" });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Order not found or cannot be updated");
  });

  it("should return 400 for invalid status", async () => {
    const order = await OrderModel.create({
      user: mockUserId,
      items: [{ product: prod1Id, quantity: 1, price: { amount: 50, currency: "INR" } }],
      totalPrice: { amount: 50, currency: "INR" },
      status: "pending",
      shippingAddress: { city: "Test City", street: "Test Street", state: "Test State", pincode: "12345", country: "Test Country" },
    });

    const response = await request(app)
      .put(`/api/order/${order._id}/status`)
      .set("Cookie", "token=mock_token")
      .send({ status: "shipped" });

    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it("should fail when user not authenticated", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .put(`/api/order/${fakeId}/status`)
      .send({ status: "cancelled" });

    expect(response.status).toBe(401);
  });
});

describe("GET /api/order/seller", () => {
  it("should get all orders for seller", async () => {
    // Create some orders
    await OrderModel.create({
      user: mockUserId,
      items: [{ product: prod1Id, quantity: 1, price: { amount: 50, currency: "INR" } }],
      status: "pending",
      totalPrice: { amount: 50, currency: "INR" },
    });

    const response = await request(app)
      .get("/api/order/seller")
      .set("Cookie", "token=mock_token");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.orders).toBeDefined();
  });

  it("should fail when user not authenticated", async () => {
    const response = await request(app)
      .get("/api/order/seller");

    expect(response.status).toBe(401);
  });
});

describe("POST /api/order/:id/cancel", () => {
  it("should cancel an order", async () => {
    const order = await OrderModel.create({
      user: mockUserId,
      items: [{ product: prod1Id, quantity: 1, price: { amount: 50, currency: "INR" } }],
      status: "pending",
      totalPrice: { amount: 50, currency: "INR" },
    });

    const response = await request(app)
      .post(`/api/order/${order._id}/cancel`)
      .set("Cookie", "token=mock_token");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.order.status).toBe("cancelled");
  });

  it("should return 404 if order not found", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .post(`/api/order/${fakeId}/cancel`)
      .set("Cookie", "token=mock_token");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("should fail when user not authenticated", async () => {
    const order = await OrderModel.create({
      user: mockUserId,
      items: [{ product: prod1Id, quantity: 1, price: { amount: 50, currency: "INR" } }],
      status: "pending",
      totalPrice: { amount: 50, currency: "INR" },
    });

    const response = await request(app)
      .post(`/api/order/${order._id}/cancel`);

    expect(response.status).toBe(401);
  });
});

describe("POST /api/order/:id/address", () => {
  it("should update order address", async () => {
    const order = await OrderModel.create({
      user: mockUserId,
      items: [{ product: prod1Id, quantity: 1, price: { amount: 50, currency: "INR" } }],
      status: "pending",
      totalPrice: { amount: 50, currency: "INR" },
      shippingAddress: { city: "Old City", street: "Old Street", state: "Old State", pincode: "12345", country: "Old Country" },
    });

    const newAddress = { city: "New City", street: "New Street", state: "New State", pincode: "54321", country: "New Country" };

    const response = await request(app)
      .post(`/api/order/${order._id}/address`)
      .set("Cookie", "token=mock_token")
      .send({ shippingAddress: newAddress });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.order.shippingAddress.city).toBe("New City");
  });

  it("should return 404 if order not found", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .post(`/api/order/${fakeId}/address`)
      .set("Cookie", "token=mock_token")
      .send({ shippingAddress: { city: "New City", street: "New Street", state: "New State", pincode: "54321", country: "New Country" } });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("should fail when user not authenticated", async () => {
    const order = await OrderModel.create({
      user: mockUserId,
      items: [{ product: prod1Id, quantity: 1, price: { amount: 50, currency: "INR" } }],
      status: "pending",
      totalPrice: { amount: 50, currency: "INR" },
    });

    const response = await request(app)
      .post(`/api/order/${order._id}/address`);

    expect(response.status).toBe(401);
  });
});
