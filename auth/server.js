require("dotenv").config();
const app = require("./src/app");
const connecttoDB = require("./src/db/db");
const { connect } = require("./src/broker/broker");

connecttoDB();
connect();


app.listen(3000, () => {
  console.log("Auth server is running on http://localhost:3000");
});
