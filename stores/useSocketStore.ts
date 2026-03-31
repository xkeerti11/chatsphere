"use client";

import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@/lib/socket-events";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

async function isSocketServerAvailable() {
  try {
    const response = await fetch("/api/socket/health", {
      cache: "no-store",
    });

    if (!response.ok) return false;

    const data = (await response.json()) as { available?: boolean };
    return data.available === true;
  } catch {
    return false;
  }
}

type SocketState = {
  socket: AppSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  onlineUserIds: string[];
  connect: (userId: string) => void;
  disconnect: () => void;
};

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  isConnecting: false,
  onlineUserIds: [],
  connect: (userId) => {
    const existingSocket = get().socket;

    if (existingSocket) {
      if (existingSocket.connected) {
        existingSocket.emit("join", { userId });
        return;
      }

      existingSocket.disconnect();
      set({ socket: null, isConnected: false, isConnecting: false });
    }

    if (get().isConnecting) return;

    set({ isConnecting: true });

    void (async () => {
      const isAvailable = await isSocketServerAvailable();

      if (!isAvailable) {
        set({ isConnecting: false, isConnected: false, socket: null });
        return;
      }

      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001", {
        transports: ["websocket"],
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 3000,
        timeout: 5000,
      });

      socket.on("connect", () => {
        set({ isConnected: true, isConnecting: false });
        socket.emit("join", { userId });
      });

      socket.on("presence_snapshot", ({ userIds }) => {
        set({ onlineUserIds: [...new Set(userIds)] as string[] });
      });

      socket.on("user_online", ({ userId: onlineUserId }) => {
        set((state) => ({
          onlineUserIds: state.onlineUserIds.includes(onlineUserId)
            ? state.onlineUserIds
            : [...state.onlineUserIds, onlineUserId],
        }));
      });

      socket.on("user_offline", ({ userId: offlineUserId }) => {
        set((state) => ({
          onlineUserIds: state.onlineUserIds.filter((id) => id !== offlineUserId),
        }));
      });

      socket.on("disconnect", () => {
        set({ isConnected: false });
      });

      socket.on("connect_error", () => {
        socket.disconnect();
        set({ socket: null, isConnected: false, isConnecting: false, onlineUserIds: [] });
      });

      set({ socket });
    })();
  },
  disconnect: () => {
    const socket = get().socket;
    socket?.disconnect();
    set({ socket: null, isConnected: false, isConnecting: false, onlineUserIds: [] });
  },
}));
