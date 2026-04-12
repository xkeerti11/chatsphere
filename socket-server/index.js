const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  response.writeHead(404);
  response.end();
});
const connectedUsers = new Map();

function getOnlineUserIds() {
  return Array.from(connectedUsers.keys());
}

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("join", ({ userId }) => {
    if (!userId) return;

    if (socket.userId && socket.userId !== userId) {
      const previousSockets = connectedUsers.get(socket.userId);

      if (previousSockets) {
        previousSockets.delete(socket.id);
        if (previousSockets.size === 0) {
          connectedUsers.delete(socket.userId);
          io.emit("user_offline", { userId: socket.userId });
        }
      }
    }

    const userSockets = connectedUsers.get(userId) || new Set();
    const wasOffline = userSockets.size === 0;
    userSockets.add(socket.id);
    connectedUsers.set(userId, userSockets);
    socket.userId = userId;
    socket.emit("presence_snapshot", { userIds: getOnlineUserIds() });

    if (wasOffline) {
      io.emit("user_online", { userId });
    }

    console.log(`User joined: ${userId}`);
  });

  socket.on("send_message", ({ to, message }) => {
    const receiverSocketIds = connectedUsers.get(to);

    if (receiverSocketIds) {
      io.to([...receiverSocketIds]).emit("receive_message", message);
      io.to([...receiverSocketIds]).emit("new_notification", {
        type: "message",
        fromUserId: message.senderId,
        fromUsername: message.senderUsername || "Someone",
        fromProfilePic: message.senderProfilePic || null,
        text: message.text ? message.text.substring(0, 50) : "Sent you a file",
        timestamp: new Date().toISOString(),
      });
    }
  });

  socket.on("typing", ({ to, from, isTyping }) => {
    const receiverSocketIds = connectedUsers.get(to);

    if (receiverSocketIds) {
      io.to([...receiverSocketIds]).emit("user_typing", { from, to, isTyping });
    }
  });

  socket.on("seen", ({ to, from, messageId }) => {
    const receiverSocketIds = connectedUsers.get(to);

    if (receiverSocketIds) {
      io.to([...receiverSocketIds]).emit("message_seen", { to, from, messageId });
    }
  });

  socket.on("disconnect", () => {
    const disconnectedUserId = socket.userId;

    if (disconnectedUserId) {
      const userSockets = connectedUsers.get(disconnectedUserId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(disconnectedUserId);
          io.emit("user_offline", { userId: disconnectedUserId });
        }
      }

      console.log(`User disconnected: ${disconnectedUserId}`);
    }
  });
});

const PORT = Number(process.env.SOCKET_PORT || process.env.PORT || 3001);

httpServer.on("error", (error) => {
  if (error && error.code === "EADDRINUSE") {
    console.error(`Socket server could not start because port ${PORT} is already in use.`);
    console.info("If `npm run dev` or `npm run dev:socket` is already running, the socket server is already up.");
    console.info(
      "Otherwise free that port or start this server with `SOCKET_PORT=3002` and update `NEXT_PUBLIC_SOCKET_URL`."
    );
    process.exit(1);
  }

  console.error("Socket server failed to start.", error);
  process.exit(1);
});

httpServer.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});
