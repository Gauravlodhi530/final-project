const express = require('express');

const app = express();

// Health check
app.get('/', (req, res) => {
    res.send('AI Buddy Service');
});

module.exports = app;