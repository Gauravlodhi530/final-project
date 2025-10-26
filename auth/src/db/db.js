const mongoose = require("mongoose");

async function connecttoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Database connect successfilly.");
  } catch (err) {
    console.log("Database connection failed");
    console.log(err);
  }
}

module.exports = connecttoDB
