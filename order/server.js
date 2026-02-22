require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/db/db");
const { connect } = require("./src/broker/broker");

// Initialize database and broker connections
connectDB();
connect();

app.listen(3003, () => {
  console.log("Order service is running on http://localhost:3003");
});
