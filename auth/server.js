require("dotenv").config();
const app = require("./src/app");
const connecttoDB = require("./src/db/db");



connecttoDB();

app.listen(3000, () => {
  console.log("Auth server is running on http://localhost:3000");
});
