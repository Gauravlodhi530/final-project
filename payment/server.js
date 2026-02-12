require("dotenv").config();
const app = require("./src/app");
const connectToDb = require("./src/db/db");

connectToDb();

app.listen(3004, () => {
  console.log("payment service is running on http://localhost:3004");
});
