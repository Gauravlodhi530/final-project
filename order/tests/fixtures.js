const mongoose = require('mongoose');
const Order = require('../src/models/order.model');

async function createMockOrder(overrides = {}) {
  const defaults = {
    customerId: new mongoose.Types.ObjectId(),
    items: [{ productId: 'prod_1', sellerId: new mongoose.Types.ObjectId(), quantity: 2, price: 50, subtotal: 100 }],
    status: 'pending',
    deliveryAddress: { street: '123 Main St', city: 'New York', state: 'NY', zip: '10001' },
    taxes: 10, shipping: 5, total: 115,
    paymentSummary: { status: 'pending', amount: 115 },
    timeline: [{ event: 'order-created', description: 'Order created' }],
    inventoryReserved: true,
    event: 'order-created'
  };
  const order = new Order({ ...defaults, ...overrides });
  return await order.save();
}

async function createMockOrders(count = 5, overrides = {}) {
  const orders = [];
  for (let i = 0; i < count; i++) {
    orders.push(await createMockOrder({
      ...overrides,
      items: [{ productId: `prod_${i + 1}`, sellerId: new mongoose.Types.ObjectId(), quantity: i + 1, price: 50 + (i * 10), subtotal: (50 + (i * 10)) * (i + 1) }]
    }));
  }
  return orders;
}

async function createOrderWithStatus(status, customerId = null) {
  return await createMockOrder({
    status,
    customerId: customerId || new mongoose.Types.ObjectId(),
    paymentSummary: { status: status === 'paid' ? 'completed' : status === 'cancelled' ? 'refunded' : 'pending', amount: 115 }
  });
}

async function createCancelledOrder(customerId = null) { return createOrderWithStatus('cancelled', customerId); }
async function createPaidOrder(customerId = null) { return createOrderWithStatus('paid', customerId); }
async function createPendingOrder(customerId = null) { return createOrderWithStatus('pending', customerId); }

module.exports = { createMockOrder, createMockOrders, createOrderWithStatus, createCancelledOrder, createPaidOrder, createPendingOrder };
