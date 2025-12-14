const express = require('express');
const cookieParser = require('cookie-parser');

const setupMiddleware = (app) => {
  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Cookie parser
  app.use(cookieParser());
  
  // CORS middleware (if needed)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
  });
};

module.exports = { setupMiddleware };