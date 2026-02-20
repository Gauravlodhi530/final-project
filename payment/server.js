require("dotenv").config();
const app = require("./src/app");
const connectToDb = require("./src/db/db");
const { connect } = require("./src/broker/broker");

connect();
connectToDb();

app.listen(3004, () => {
  console.log("payment service is running on http://localhost:3004");
});
