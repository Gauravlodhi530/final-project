const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");


async function initSocketServer(httpServer) {
  const io = new Server(httpServer, {});

  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers?.cookie;

    if (!cookieHeader) {
      return next(new Error("No cookies found"));
    }

    const {token} = cookie ? cookie.parse(cookieHeader) : {};
    
    if (!token) {
      return next(new Error("Authentication token not found"));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded; 
        next();


    } catch (error) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("A user connected: " + socket.id);
  });
}

module.exports = { initSocketServer };
