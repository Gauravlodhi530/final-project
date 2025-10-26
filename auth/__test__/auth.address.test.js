const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user.model");

let authToken;

beforeEach(async () => {
  await User.deleteMany({});

  await request(app)
    .post("/api/auth/register")
    .send({
      userName: "addruser",
      email: "addr@example.com",
      password: "addrpass123",
      fullName: { firstName: "Addr", lastName: "User" },
    });

  const loginRes = await request(app).post("/api/auth/login").send({
    email: "addr@example.com",
    password: "addrpass123",
  });

  authToken = loginRes.body.token;
});

describe("Address Routes", () => {
  test("GET /users/me/addresses - empty initially", async () => {
    const res = await request(app)
      .get("/api/auth/users/me/addresses")
      .set("Cookie", `token=${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.addresses).toEqual([]);
  });

  test("POST /users/me/address - valid address", async () => {
    const payload = {
      street: "123 Test St",
      city: "Testville",
      state: "TS",
      pincode: "123456",
      country: "Testland",
      isDefault: true,
    };
    const res = await request(app)
      .post("/api/auth/users/me/address")
      .set("Cookie", `token=${authToken}`)
      .send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body.address.street).toBe(payload.street);
  });

  test("POST /users/me/address - invalid pincode returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/users/me/address")
      .set("Cookie", `token=${authToken}`)
      .send({
        street: "Bad",
        city: "BadCity",
        state: "BD",
        pincode: "12",
        country: "Badland",
      });
    expect(res.statusCode).toBe(400);
  });
});
