require("dotenv").config();
const app = require("./src/app");
const { connectDB } = require("./src/setup/database");

try {
  connectDB();
  app.listen(3001, () => {
    console.log("Product service listening on http://localhost:3001");
  });
} catch (error) {
  console.error("Failed to start server:", error);
  process.exit(1);
}
