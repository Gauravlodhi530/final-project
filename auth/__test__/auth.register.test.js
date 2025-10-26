const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user.model");

// Clear users before each test in this suite
beforeEach(async () => {
  await User.deleteMany({});
});

describe("POST /api/auth/register", () => {
  test("creates a new user with valid data", async () => {
    const payload = {
      userName: "testuser",
      email: "test@example.com",
      password: "password123",
      fullName: { firstName: "Test", lastName: "User" },
    };

    const res = await request(app).post("/api/auth/register").send(payload);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message", "User registered successfully");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("_id");
    expect(res.body.user.email).toBe(payload.email);
    expect(res.body.user.userName).toBe(payload.userName);

    const user = await User.findOne({ email: payload.email });
    expect(user).not.toBeNull();
    expect(user.userName).toBe(payload.userName);
    expect(user.fullName.firstName).toBe(payload.fullName.firstName);
  });

  test("returns 400 for missing fields", async () => {
    const res = await request(app).post("/api/auth/register").send({});
    expect(res.statusCode).toBe(400);
  });
});


