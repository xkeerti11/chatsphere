import { createServer } from "node:http";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io";
import { getEnv } from "../lib/env.ts";
import type { ClientToServerEvents, ServerToClientEvents } from "../lib/socket-events.ts";

const adapter = new PrismaPg({
  connectionString: getEnv("DATABASE_URL", "postgresql://localhost/postgres"),
});
const prisma = new PrismaClient({ adapter });
const connectedUsers = new Map<string, Set<string>>();
const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function getOnlineUserIds() {
  return [...connectedUsers.keys()];
}

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

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("join", async ({ userId }) => {
    if (!userId) return;

    const previousUserId = socket.data.userId;
    if (previousUserId && previousUserId !== userId) {
      const previousSockets = connectedUsers.get(previousUserId);

      previousSockets?.delete(socket.id);
      if (previousSockets && previousSockets.size === 0) {
        connectedUsers.delete(previousUserId);
        await prisma.user
          .update({
            where: { id: previousUserId },
            data: { isOnline: false, lastSeen: new Date() },
          })
          .catch(() => undefined);
        io.emit("user_offline", { userId: previousUserId });
      }
    }

    const userSockets = connectedUsers.get(userId) ?? new Set<string>();
    const wasOffline = userSockets.size === 0;
    userSockets.add(socket.id);
    connectedUsers.set(userId, userSockets);
    socket.data.userId = userId;

    socket.emit("presence_snapshot", { userIds: getOnlineUserIds() });

    if (wasOffline) {
      await prisma.user
        .update({
          where: { id: userId },
          data: { isOnline: true, lastSeen: new Date() },
        })
        .catch(() => undefined);
      io.emit("user_online", { userId });
    }
  });

  socket.on("send_message", ({ to, message }) => {
    const receiverSocketIds = connectedUsers.get(to);
    if (receiverSocketIds) {
      io.to([...receiverSocketIds]).emit("receive_message", message);
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

  socket.on("disconnect", async () => {
    const disconnectedUserId = socket.data.userId;

    if (!disconnectedUserId) return;

    const userSockets = connectedUsers.get(disconnectedUserId);
    userSockets?.delete(socket.id);

    if (userSockets && userSockets.size > 0) {
      return;
    }

    connectedUsers.delete(disconnectedUserId);
    await prisma.user
      .update({
        where: { id: disconnectedUserId },
        data: { isOnline: false, lastSeen: new Date() },
      })
      .catch(() => undefined);
    io.emit("user_offline", { userId: disconnectedUserId });
  });
});

const PORT = Number(process.env.SOCKET_PORT ?? process.env.PORT ?? 3001);

httpServer.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
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
  console.info(`ChatSphere socket server listening on ${PORT}`);
});
