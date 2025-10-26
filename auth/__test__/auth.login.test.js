const request = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../src/app");
const User = require("../src/models/user.model");

beforeEach(async () => {
  await User.deleteMany({});
  const hashedPassword = await bcrypt.hash("testpassword123", 10);
  await User.create({
    userName: "testuser",
    email: "testlogin@example.com",
    password: hashedPassword,
    fullName: { firstName: "Test", lastName: "Login" },
  });
});

describe("POST /api/auth/login", () => {
  test("should log in successfully with valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "testlogin@example.com", password: "testpassword123" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  test("should return 400 for invalid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "testlogin@example.com", password: "wrongpassword" });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Invalid email or password");
  });

  test("should return 400 if email or password missing", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "" });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
  });
});


