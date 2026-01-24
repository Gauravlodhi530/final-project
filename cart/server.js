const app = require("./src/app");
require("dotenv").config();
const connectToDB = require("./src/db/db");

connectToDB()


app.listen(3002, () => {
    console.log(`Cart service is running on port 3002`);
});