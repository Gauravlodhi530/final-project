const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { resetCart } = require('../src/controllers/cartController');

describe('Cart Service API', () => {
  let productId1, productId2;
  let authToken;

  beforeEach(() => {
    // Reset cart before each test
    resetCart();
    // Initialize test product IDs
    productId1 = 'PROD001';
    productId2 = 'PROD002';
    // Generate a valid JWT token for testing
    authToken = jwt.sign({ id: 'test-user', role: 'user' }, process.env.JWT_SECRET || 'test-secret');
  });

  // ===== GET /cart =====
  describe('GET /cart', () => {
    it('should retrieve an empty cart initially', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({});
    });

    it('should return cart with items after adding items', async () => {
      // First add an item
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: productId1, qty: 2 });

      // Then fetch cart
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[productId1]).toBeDefined();
      expect(res.body.data[productId1].qty).toBe(2);
    });
  });

  // ===== POST /cart/items =====
  describe('POST /cart/items', () => {
    it('should add an item to the cart', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: productId1, qty: 2 });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.productId).toBe(productId1);
      expect(res.body.data.qty).toBe(3);
      expect(res.body.message).toBe('Item added to cart');
    });

    it('should increment quantity if item already exists', async () => {
      // Add item first time
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: productId1, qty: 2 });

      // Add same item again
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: productId1, qty: 3 });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.qty).toBe(5); // 2 + 3
    });

    it('should return 400 if productId is missing', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ qty: 2 });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('productId and qty are required');
    });

    it('should return 400 if qty is missing', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: productId1 });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('productId and qty are required');
    });

    it('should return 400 if qty is 0 or negative', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: productId1, qty: 0 });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('qty must be greater than 0');
    });

    it('should add multiple different items to cart', async () => {
      // Add first item
      const res1 = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: productId1, qty: 1 });

      // Add second item
      const res2 = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: productId2, qty: 2 });

      expect(res1.statusCode).toBe(201);
      expect(res2.statusCode).toBe(201);

      // Verify both items in cart
      const cartRes = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);
      expect(Object.keys(cartRes.body.data)).toHaveLength(2);
    });
  });

  // ===== PATCH /cart/items/:productId =====
  describe('PATCH /cart/items/:productId', () => {
    beforeEach(async () => {
      // Add item to cart before each test
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: productId1, qty: 5 });
    });

    it('should update item quantity in cart', async () => {
      const res = await request(app)
        .patch(`/api/cart/items/${productId1}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ qty: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.qty).toBe(10);
      expect(res.body.message).toBe('Item quantity updated');
    });

    it('should remove item if qty is set to 0', async () => {
      const res = await request(app)
        .patch(`/api/cart/items/${productId1}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ qty: 0 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Item removed from cart');

      // Verify item is removed
      const cartRes = await request(app).get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);
      expect(cartRes.body.data[productId1]).toBeUndefined();
    });

    it('should remove item if qty is negative', async () => {
      const res = await request(app)
        .patch(`/api/cart/items/${productId1}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ qty: -5 });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Item removed from cart');
    });

    it('should return 404 if item not in cart', async () => {
      const res = await request(app)
        .patch(`/api/cart/items/NONEXISTENT`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ qty: 5 });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Item not found in cart');
    });

    it('should return 400 if qty is not provided', async () => {
      const res = await request(app)
        .patch(`/api/cart/items/${productId1}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('qty is required');
    });
  });

  // ===== DELETE /cart/items/:productId =====
  describe('DELETE /cart/items/:productId', () => {
    beforeEach(async () => {
      // Add items to cart before each test
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: productId1, qty: 2 });
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: productId2, qty: 3 });
    });

    it('should remove an item from the cart', async () => {
      const res = await request(app)
        .delete(`/api/cart/items/${productId1}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Item removed from cart');

      // Verify item is removed
      const cartRes = await request(app).get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);
      expect(cartRes.body.data[productId1]).toBeUndefined();
      expect(cartRes.body.data[productId2]).toBeDefined();
    });

    it('should return 404 if item not in cart', async () => {
      const res = await request(app)
        .delete(`/api/cart/items/NONEXISTENT`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Item not found in cart');
    });

    it('should remove multiple items independently', async () => {
      // Remove first item
      await request(app).delete(`/api/cart/items/${productId1}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Remove second item
      const res = await request(app).delete(`/api/cart/items/${productId2}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);

      // Verify cart is empty
      const cartRes = await request(app).get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);
      expect(Object.keys(cartRes.body.data)).toHaveLength(0);
    });
  });

  // ===== DELETE /cart =====
  describe('DELETE /cart', () => {
    beforeEach(async () => {
      // Add multiple items to cart before each test
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: productId1, qty: 2 });
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: productId2, qty: 3 });
    });

    it('should clear the entire cart', async () => {
      const res = await request(app).delete('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Cart cleared');

      // Verify cart is empty
      const cartRes = await request(app).get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);
      expect(cartRes.body.data).toEqual({});
    });

    it('should clear cart even if already empty', async () => {
      // Clear cart twice
      await request(app).delete('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);
      const res = await request(app).delete('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

