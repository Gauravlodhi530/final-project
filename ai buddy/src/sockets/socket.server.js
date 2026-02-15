const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const agent = require("../agents/agent");

async function initSocketServer(httpServer) {
  const io = new Server(httpServer, {});

  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers?.cookie;

    if (!cookieHeader) {
      return next(new Error("No cookies found"));
    }

    const { token } = cookie ? cookie.parse(cookieHeader) : {};

    if (!token) {
      return next(new Error("Authentication token not found"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      socket.token = token;
      next();
    } catch (error) {
      return next(new Error("Invalid token"));
    }
  });

  // single connection handler (merged) — log and handle messages
  io.on("connection", (socket) => {
    console.log(socket.user, socket.token);
    console.log("A user connected: " + socket.id);

    // handle messages from connected sockets
    socket.on("message", async (data) => {
      if (!data) {
        return socket.emit("ai_error", { message: "Empty message" });
      }

      try {
        socket.emit("ai_processing");

        const agentResponse = await agent.invoke(
          {
            messages: [
              {
                role: "user",
                content: data,
              },
            ],
          },
          {
            metadata: {
              token: socket.token,
            },
          },
        );

        console.log("AI response", agentResponse);
        socket.emit("ai_response", agentResponse);
      } catch (error) {
        console.error("Agent invoke error", error);
        socket.emit("ai_error", { message: "AI processing error" });
      }
    });
  });
}

module.exports = { initSocketServer };
