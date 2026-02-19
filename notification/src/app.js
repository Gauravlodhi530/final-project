const express = require("express");
const { connect, subscribeToQueue } = require("./broker/broker");



connect();
const app = express();

app.get("/", (req, res) => {
  res.send("Notification service is running");
});


subscribeToQueue("AUTH_NOTIFICATION.USER_CREATED", (data) => {
  console.log("Received message from AUTH_NOTIFICATION.USER_CREATED:", data);

});

module.exports = app;
