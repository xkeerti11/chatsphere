"use client";

import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@/lib/socket-events";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type SocketState = {
  socket: AppSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  onlineUserIds: string[];
  initSocket: (userId: string) => void;
  disconnectSocket: () => void;
  connect: (userId: string) => void;
  disconnect: () => void;
};

export const useSocketStore = create<SocketState>((set, get) => {
  const initSocket = (userId: string) => {
    const existingSocket = get().socket;

    if (existingSocket) {
      if (existingSocket.connected) {
        existingSocket.emit("join", { userId });
        return;
      }

      existingSocket.removeAllListeners();
      existingSocket.disconnect();
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    set({
      socket,
      isConnected: false,
      isConnecting: true,
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      set({ isConnected: true, isConnecting: false });
      socket.emit("join", { userId });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      set({ isConnected: false, isConnecting: false });
    });

    socket.on("connect_error", () => {
      set({ isConnected: false, isConnecting: false });
    });

    socket.on("presence_snapshot", ({ userIds }: { userIds: string[] }) => {
      set({ onlineUserIds: [...new Set(userIds)] });
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
  };

  const disconnectSocket = () => {
    const socket = get().socket;

    socket?.removeAllListeners();
    socket?.disconnect();

    set({
      socket: null,
      isConnected: false,
      isConnecting: false,
      onlineUserIds: [],
    });
  };

  return {
    socket: null,
    isConnected: false,
    isConnecting: false,
    onlineUserIds: [],
    initSocket,
    disconnectSocket,
    connect: initSocket,
    disconnect: disconnectSocket,
  };
});
