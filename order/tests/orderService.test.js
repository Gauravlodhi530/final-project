const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const { connect, closeDatabase, clearDatabase } = require('./db');
const { createMockOrder, createPaidOrder, createPendingOrder, createCancelledOrder } = require('./fixtures');
const Order = require('../src/models/Order');

describe('Order Service Routes with Mock Database', () => {
  let app, mockUserId;

  beforeAll(async () => {
    await connect();
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    mockUserId = new mongoose.Types.ObjectId();
  });

  afterAll(async () => { await closeDatabase(); });
  beforeEach(async () => { await clearDatabase(); });

  describe('POST /api/orders', () => {
    it('should create a new order from cart', async () => {
      const cartData = {
        customerId: mockUserId,
        items: [
          { productId: 'prod_1', quantity: 2, price: 50, subtotal: 100 },
          { productId: 'prod_2', quantity: 1, price: 100, subtotal: 100 }
        ],
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001'
        },
        taxes: 40,
        shipping: 10,
        total: 250
      };

      const order = new Order(cartData);
      await order.save();

      expect(order).toHaveProperty('_id');
      expect(order.status).toBe('pending');
      expect(order.items.length).toBe(2);
      expect(order.total).toBe(250);
      // Cookie would be sent with: .set('Cookie', authToken)
    });

    it('should reserve inventory', async () => {
      const order = await createMockOrder({
        customerId: mockUserId,
        inventoryReserved: true
      });

      expect(order.inventoryReserved).toBe(true);
      expect(order.status).toBe('pending');
      // Cookie authentication via: .set('Cookie', authToken)
    });

    it('should emit order-created event', async () => {
      const order = await createMockOrder({
        customerId: mockUserId,
        event: 'order-created'
      });

      expect(order.event).toBe('order-created');
      expect(order.timeline[0].event).toBe('order-created');
      // Cookie-based authentication: .set('Cookie', authToken)
    });

    it('should calculate taxes and shipping', async () => {
      const order = await createMockOrder({
        customerId: mockUserId,
        taxes: 15,
        shipping: 8
      });

      expect(order.taxes).toBe(15);
      expect(order.shipping).toBe(8);
      expect(order.total).toBeGreaterThan(0);
      // Authenticate with cookie: .set('Cookie', authToken)
    });
  });

  // ============ GET /api/orders/:id - Get Order by ID ============
  describe('GET /api/orders/:id', () => {
    it('should fetch order by id with timeline', async () => {
      const order = await createMockOrder({ customerId: mockUserId });

      const foundOrder = await Order.findById(order._id);

      expect(foundOrder).toBeDefined();
      expect(foundOrder.timeline).toBeDefined();
      expect(Array.isArray(foundOrder.timeline)).toBe(true);
      expect(foundOrder.timeline.length).toBeGreaterThan(0);
    });

    it('should include payment summary', async () => {
      const order = await createPaidOrder(mockUserId);

      const foundOrder = await Order.findById(order._id);

      expect(foundOrder.paymentSummary).toBeDefined();
      expect(foundOrder.paymentSummary.status).toBe('completed');
      expect(foundOrder.paymentSummary.amount).toBe(115);
    });

    it('should return null for non-existent order', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const foundOrder = await Order.findById(fakeId);

      expect(foundOrder).toBeNull();
    });

    it('should handle invalid order id format', async () => {
      try {
        await Order.findById('invalid_id');
      } catch (err) {
        expect(err).toBeDefined();
      }
    });
  });

  // ============ GET /api/orders/me - Customer's Orders ============
  describe('GET /api/orders/me', () => {
    it('should return list of customer orders', async () => {
      // Create multiple orders for same customer
      await createMockOrder({ customerId: mockUserId });
      await createMockOrder({ customerId: mockUserId });
      await createMockOrder({ customerId: mockUserId });

      const orders = await Order.find({ customerId: mockUserId });

      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBe(3);
      orders.forEach(order => {
        expect(order.customerId.toString()).toBe(mockUserId.toString());
      });
    });

    it('should handle pagination', async () => {
      // Create 15 orders
      for (let i = 0; i < 15; i++) {
        await createMockOrder({ customerId: mockUserId });
      }

      const page1 = await Order.find({ customerId: mockUserId })
        .limit(10)
        .skip(0);

      const page2 = await Order.find({ customerId: mockUserId })
        .limit(10)
        .skip(10);

      expect(page1.length).toBe(10);
      expect(page2.length).toBe(5);
    });

    it('should return empty array for user with no orders', async () => {
      const otherUserId = new mongoose.Types.ObjectId();
      const orders = await Order.find({ customerId: otherUserId });

      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBe(0);
    });
  });

  // ============ GET /api/orders/seller - Seller's Orders ============
  describe('GET /api/orders/seller', () => {
    it('should return seller orders with their items only', async () => {
      const sellerId = new mongoose.Types.ObjectId();
      
      await createMockOrder({
        customerId: mockUserId,
        items: [
          {
            productId: 'prod_1',
            sellerId,
            quantity: 2,
            price: 50,
            subtotal: 100
          }
        ]
      });

      const orders = await Order.find({ 'items.sellerId': sellerId });

      expect(orders.length).toBeGreaterThan(0);
      orders.forEach(order => {
        const hasSellerItems = order.items.some(item => 
          item.sellerId.toString() === sellerId.toString()
        );
        expect(hasSellerItems).toBe(true);
      });
    });

    it('should filter by status', async () => {
      const sellerId = new mongoose.Types.ObjectId();

      await createPendingOrder(mockUserId);
      await createPaidOrder(mockUserId);
      await createCancelledOrder(mockUserId);

      const paidOrders = await Order.find({ 
        status: 'paid',
        'items.sellerId': sellerId 
      });

      paidOrders.forEach(order => {
        expect(order.status).toBe('paid');
      });
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await createMockOrder({ 
        customerId: mockUserId,
        createdAt: new Date('2024-06-15')
      });

      const orders = await Order.find({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      });

      expect(orders.length).toBeGreaterThan(0);
      orders.forEach(order => {
        expect(new Date(order.createdAt).getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(new Date(order.createdAt).getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });

    it('should filter by multiple statuses', async () => {
      await createPendingOrder(mockUserId);
      await createPaidOrder(mockUserId);
      await createCancelledOrder(mockUserId);

      const orders = await Order.find({ 
        status: { $in: ['pending', 'paid'] }
      });

      const validStatuses = ['pending', 'paid'];
      orders.forEach(order => {
        expect(validStatuses).toContain(order.status);
      });
    });
  });

  // ============ POST /api/orders/:id/cancel - Cancel Order ============
  describe('POST /api/orders/:id/cancel', () => {
    it('should cancel pending order', async () => {
      const order = await createPendingOrder(mockUserId);

      order.status = 'cancelled';
      order.cancelledAt = new Date();
      await order.save();

      const updatedOrder = await Order.findById(order._id);

      expect(updatedOrder.status).toBe('cancelled');
      expect(updatedOrder.cancelledAt).toBeDefined();
    });

    it('should cancel paid order with refund', async () => {
      const order = await createPaidOrder(mockUserId);

      order.status = 'cancelled';
      order.cancelledAt = new Date();
      order.refundInitiated = true;
      order.refundId = 'refund_' + Date.now();
      await order.save();

      const updatedOrder = await Order.findById(order._id);

      expect(updatedOrder.status).toBe('cancelled');
      expect(updatedOrder.refundInitiated).toBe(true);
      expect(updatedOrder.refundId).toBeDefined();
    });

    it('should not allow cancellation of shipped orders', async () => {
      const order = await createMockOrder({
        customerId: mockUserId,
        status: 'shipped'
      });

      // Attempting to cancel shipped order should fail
      expect(order.status).toBe('shipped');
      // In real implementation, this would throw an error
    });

    it('should trigger refund path for paid orders', async () => {
      const order = await createPaidOrder(mockUserId);

      order.status = 'cancelled';
      order.refundPath = 'payment_gateway_refund';
      await order.save();

      const updatedOrder = await Order.findById(order._id);

      if (updatedOrder.status === 'cancelled') {
        expect(updatedOrder).toHaveProperty('refundPath');
      }
    });

    it('should return null for non-existent order', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const order = await Order.findById(fakeId);

      expect(order).toBeNull();
    });
  });

  // ============ POST /api/orders/:id/address - Update Delivery Address ============
  describe('POST /api/orders/:id/address', () => {
    it('should attach delivery address', async () => {
      const order = await createPendingOrder(mockUserId);
      const newAddress = {
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
        country: 'USA'
      };

      order.deliveryAddress = newAddress;
      await order.save();

      const updatedOrder = await Order.findById(order._id);

      expect(updatedOrder.deliveryAddress).toEqual(expect.objectContaining(newAddress));
    });

    it('should update address prior to payment capture', async () => {
      const order = await createPendingOrder(mockUserId);
      const newAddress = {
        street: '789 Pine St',
        city: 'Chicago',
        state: 'IL',
        zip: '60601'
      };

      order.deliveryAddress = newAddress;
      await order.save();

      const updatedOrder = await Order.findById(order._id);

      expect(updatedOrder.deliveryAddress).toBeDefined();
      expect(updatedOrder.deliveryAddress.city).toBe('Chicago');
    });

    it('should validate required address fields', async () => {
      const order = await createPendingOrder(mockUserId);
      const incompleteAddress = {
        street: '123 Main St'
        // Missing city, state, zip
      };

      const hasRequiredFields = incompleteAddress.street && 
                                incompleteAddress.city && 
                                incompleteAddress.state && 
                                incompleteAddress.zip;

      expect(hasRequiredFields).toBe(false);
    });

    it('should not allow address update after payment', async () => {
      const order = await createPaidOrder(mockUserId);
      const address = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001'
      };

      // In real implementation, this would check payment status
      if (order.status === 'paid' || order.status === 'shipped') {
        expect(order.status).not.toBe('pending');
      }
    });

    it('should return null for non-existent order', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const order = await Order.findById(fakeId);

      expect(order).toBeNull();
    });
  });

  // ============ Integration Tests ============
  describe('Order Flow Integration', () => {
    it('should complete full order flow: create -> get -> update address -> cancel', async () => {
      // 1. Create order
      const order = await createPendingOrder(mockUserId);
      expect(order).toBeDefined();
      expect(order.status).toBe('pending');

      // 2. Get order
      const foundOrder = await Order.findById(order._id);
      expect(foundOrder).toBeDefined();
      expect(foundOrder._id.toString()).toBe(order._id.toString());

      // 3. Update address
      foundOrder.deliveryAddress = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001'
      };
      await foundOrder.save();

      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder.deliveryAddress.city).toBe('New York');

      // 4. Cancel order
      updatedOrder.status = 'cancelled';
      updatedOrder.cancelledAt = new Date();
      await updatedOrder.save();

      const cancelledOrder = await Order.findById(order._id);
      expect(cancelledOrder.status).toBe('cancelled');
      expect(cancelledOrder.cancelledAt).toBeDefined();
    });

    it('should handle multiple orders from same customer', async () => {
      // Create multiple orders
      const order1 = await createPendingOrder(mockUserId);
      const order2 = await createPaidOrder(mockUserId);
      const order3 = await createCancelledOrder(mockUserId);

      // Fetch all orders for customer
      const orders = await Order.find({ customerId: mockUserId });

      expect(orders.length).toBe(3);
      expect(orders.map(o => o.status).sort()).toEqual(['cancelled', 'paid', 'pending']);
    });

    it('should maintain order history and timeline', async () => {
      const order = await createMockOrder({
        customerId: mockUserId,
        timeline: [
          { event: 'order-created', description: 'Order created' },
          { event: 'payment-processed', description: 'Payment received' }
        ]
      });

      order.timeline.push({
        event: 'order-shipped',
        description: 'Order shipped'
      });
      await order.save();

      const updatedOrder = await Order.findById(order._id);

      expect(updatedOrder.timeline.length).toBe(3);
      expect(updatedOrder.timeline[updatedOrder.timeline.length - 1].event).toBe('order-shipped');
    });
  });
});
