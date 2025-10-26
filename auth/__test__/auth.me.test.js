const request = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../src/app");
const User = require("../src/models/user.model");

let authToken;

beforeEach(async () => {
  await User.deleteMany({});
  const hashedPassword = await bcrypt.hash("testpassword123", 10);
  await User.create({
    userName: "testuser",
    email: "testme@example.com",
    password: hashedPassword,
    fullName: { firstName: "Test", lastName: "Me" },
  });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: "testme@example.com", password: "testpassword123" });
  authToken = loginRes.body.token;
});

describe("GET /api/auth/me", () => {
  test("should return user profile with valid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `token=${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.email).toBe("testme@example.com");
    expect(res.body.user.userName).toBe("testuser");
    expect(res.body.user).not.toHaveProperty("password");
  });

  test("should return 401 without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message");
  });

  test("should return 401 with invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", "token=invalidtoken123");
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message");
  });
});


