"use client";

import { create } from "zustand";
import type { FriendListItem, MessageDto } from "@/lib/types";

type FriendListUpdater = FriendListItem[] | ((friends: FriendListItem[]) => FriendListItem[]);

type ChatState = {
  selectedFriend: FriendListItem | null;
  friends: FriendListItem[];
  messages: MessageDto[];
  pendingRequestCount: number;
  setSelectedFriend: (friend: FriendListItem | null) => void;
  setFriends: (friends: FriendListUpdater) => void;
  setMessages: (messages: MessageDto[]) => void;
  addMessage: (message: MessageDto) => void;
  markMessagesRead: (friendId: string) => void;
  setPendingRequestCount: (count: number) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  selectedFriend: null,
  friends: [],
  messages: [],
  pendingRequestCount: 0,
  setSelectedFriend: (selectedFriend) => set({ selectedFriend }),
  setFriends: (friends) =>
    set((state) => ({
      friends: typeof friends === "function" ? friends(state.friends) : friends,
    })),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => {
      const exists = state.messages.some((item) => item.id === message.id);
      if (exists) return state;
      return { messages: [...state.messages, message] };
    }),
  markMessagesRead: (friendId) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.receiverId === friendId
          ? { ...message, isRead: true, seenAt: new Date().toISOString() }
          : message,
      ),
    })),
  setPendingRequestCount: (pendingRequestCount) => set({ pendingRequestCount }),
}));
