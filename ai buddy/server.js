require('dotenv').config();
const app = require('./src/app')
const http = require('http');
const { initSocketServer } = require('./src/sockets/socket.server');

const server = http.createServer(app);

initSocketServer(server);

server.listen(3005,()=>{
    console.log("server is running http://localhost:3005");
})