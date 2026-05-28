const { createServer } = require("http");
const { Server } = require("socket.io");

const connectedUsers = new Map();

function getOnlineUserIds() {
  return Array.from(connectedUsers.keys());
}

const httpServer = createServer((request, response) => {
  if (request.url === "/notify-friend-request" && request.method === "POST") {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", () => {
      try {
        const { to, from } = JSON.parse(body);
        const receiverSocketIds = connectedUsers.get(to);

        if (receiverSocketIds) {
          io.to([...receiverSocketIds]).emit("new_notification", {
            type: "friend_request",
            fromUserId: from.id,
            fromUsername: from.username,
            fromProfilePic: from.profilePic,
            text: `${from.username} sent you a friend request`,
            timestamp: new Date().toISOString(),
          });
        }

        response.writeHead(200, {
          "Content-Type": "application/json",
        });
        response.end(JSON.stringify({ ok: true }));
      } catch (e) {
        response.writeHead(500);
        response.end();
      }
    });

    return;
  }

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

    connectedUsers.delete(userId);

    const userSockets = new Set();
    userSockets.add(socket.id);
    connectedUsers.set(userId, userSockets);
    socket.userId = userId;

    socket.emit("presence_snapshot", {
      userIds: Array.from(connectedUsers.keys()),
    });

    socket.broadcast.emit("user_online", { userId });

    console.log(`User joined: ${userId}, socketId: ${socket.id}`);
    console.log(`Total online users: ${connectedUsers.size}`);
  });

  socket.on("send_message", ({ to, message }) => {
    const receiverSocketIds = connectedUsers.get(to);

    console.log(
      `Sending to ${to}, socketIds:`,
      receiverSocketIds ? [...receiverSocketIds] : "NOT FOUND"
    );

    if (receiverSocketIds && receiverSocketIds.size > 0) {
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

  // ─── CALL SIGNALING EVENTS ───────────────────────

  // Step 1: Caller initiates call
  socket.on("call:initiate", ({ to, from, offer, callerName, callerPic }) => {
    const receiverSocketIds = connectedUsers.get(to);

    console.log(`Call from ${from} to ${to}`);
    console.log(
      "Receiver socket IDs:",
      receiverSocketIds ? [...receiverSocketIds] : "NOT FOUND"
    );
    console.log("All online users:", Array.from(connectedUsers.keys()));

    if (receiverSocketIds && receiverSocketIds.size > 0) {
      io.to([...receiverSocketIds]).emit("call:incoming", {
        from,
        callerName,
        callerPic,
        offer,
      });
      console.log(`call:incoming emitted to ${to}`);
    } else {
      // Receiver offline
      socket.emit("call:unavailable", { userId: to });
      console.log(`User ${to} not found in connectedUsers`);
    }
  });

  // Step 2: Receiver accepts call
  socket.on("call:accept", ({ to, answer }) => {
    const callerSocketIds = connectedUsers.get(to);
    if (callerSocketIds) {
      io.to([...callerSocketIds]).emit("call:accepted", { answer });
    }
  });

  // Step 3: Receiver rejects call
  socket.on("call:reject", ({ to }) => {
    const callerSocketIds = connectedUsers.get(to);
    if (callerSocketIds) {
      io.to([...callerSocketIds]).emit("call:rejected");
    }
  });

  // Step 4: ICE candidates exchange
  socket.on("call:ice-candidate", ({ to, candidate }) => {
    const receiverSocketIds = connectedUsers.get(to);
    if (receiverSocketIds) {
      io.to([...receiverSocketIds]).emit("call:ice-candidate", { candidate });
    }
  });

  // Step 5: End call
  socket.on("call:end", ({ to }) => {
    const receiverSocketIds = connectedUsers.get(to);
    if (receiverSocketIds) {
      io.to([...receiverSocketIds]).emit("call:ended");
    }
  });

  // ─────────────────────────────────────────────────

  socket.on("disconnect", () => {
    const userId = socket.userId;

    if (!userId) return;

    const userSockets = connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        connectedUsers.delete(userId);
        io.emit("user_offline", { userId });
        console.log(`User offline: ${userId}`);
      }
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
