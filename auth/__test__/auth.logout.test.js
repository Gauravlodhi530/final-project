const request = require("supertest");
const bcrypt = require("bcrypt");
jest.mock("../src/db/redis", () => ({
  set: jest.fn().mockResolvedValue("OK"),
  on: () => {},
  quit: async () => {},
}));
const redis = require("../src/db/redis");
const app = require("../src/app");
const User = require("../src/models/user.model");

let authToken;

beforeEach(async () => {
  await User.deleteMany({});
  const hashedPassword = await bcrypt.hash("testpassword123", 10);
  await User.create({
    userName: "testuser",
    email: "testlogout@example.com",
    password: hashedPassword,
    fullName: { firstName: "Test", lastName: "Logout" },
  });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: "testlogout@example.com", password: "testpassword123" });
  authToken = loginRes.body.token;
});

describe("GET /api/auth/logout", () => {
  test("clears token cookie, sets flags, blacklists token, returns 200", async () => {
    const res = await request(app)
      .get("/api/auth/logout")
      .set("Cookie", `token=${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Logged out successfully");
    const setCookie = res.headers["set-cookie"]?.join(";") || "";
    expect(setCookie).toMatch(/token=;/); // cleared cookie
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/Secure/i);
    expect(redis.set).toHaveBeenCalled();
    const [[key]] = redis.set.mock.calls;
    expect(key).toMatch(/^blacklist:/);
  });

  test("returns 200 even without token cookie", async () => {
    const res = await request(app).get("/api/auth/logout");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Logged out successfully");
  });
});


