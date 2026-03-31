"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { FriendSearch } from "@/components/friends/FriendSearch";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/client-api";
import type { FriendListItem, MessageDto } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useSocketStore } from "@/stores/useSocketStore";

export function ChatWorkspace() {
  const searchParams = useSearchParams();
  const friendParam = searchParams.get("friend");
  const hydrated = useAuthStore((state) => state.hydrated);
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?.id ?? null;
  const socket = useSocketStore((state) => state.socket);
  const isSocketConnected = useSocketStore((state) => state.isConnected);
  const onlineUserIds = useSocketStore((state) => state.onlineUserIds);
  const friends = useChatStore((state) => state.friends);
  const setFriends = useChatStore((state) => state.setFriends);
  const messages = useChatStore((state) => state.messages);
  const setMessages = useChatStore((state) => state.setMessages);
  const addMessage = useChatStore((state) => state.addMessage);
  const markMessagesRead = useChatStore((state) => state.markMessagesRead);
  const selectedFriend = useChatStore((state) => state.selectedFriend);
  const setSelectedFriend = useChatStore((state) => state.setSelectedFriend);
  const [typing, setTyping] = useState(false);
  const selectedFriendId = selectedFriend?.id ?? null;
  const loadedFriendsForUserRef = useRef<string | null>(null);

  const loadFriends = useEffectEvent(async () => {
    try {
      const data = await apiClient.get<{ success: true; friends: FriendListItem[] }>("/api/friends/list");

      setFriends(data.friends);

      const chosen =
        data.friends.find((friend) => friend.id === friendParam) ??
        data.friends.find((friend) => friend.id === selectedFriendId) ??
        null;

      if (chosen?.id !== selectedFriendId) {
        setSelectedFriend(chosen);
      } else if (!chosen) {
        setSelectedFriend(null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load friends");
    }
  });

  useEffect(() => {
    if (!hydrated || !currentUserId) {
      loadedFriendsForUserRef.current = null;
      return;
    }

    if (loadedFriendsForUserRef.current === currentUserId) {
      return;
    }

    loadedFriendsForUserRef.current = currentUserId;
    void loadFriends();
  }, [currentUserId, hydrated]);

  useEffect(() => {
    if (!friendParam) return;

    const chosen = friends.find((friend) => friend.id === friendParam);

    if (chosen && chosen.id !== selectedFriendId) {
      setSelectedFriend(chosen);
    }
  }, [friendParam, friends, selectedFriendId, setSelectedFriend]);

  useEffect(() => {
    if (!hydrated || !currentUserId || !isSocketConnected) return;
    void loadFriends();
  }, [currentUserId, hydrated, isSocketConnected]);

  useEffect(() => {
    if (!hydrated || !currentUserId || !selectedFriendId) return;

    const userId = currentUserId;
    const friendId = selectedFriendId;
    let cancelled = false;

    async function loadMessages() {
      try {
        const data = await apiClient.get<{ success: true; messages: MessageDto[] }>(
          `/api/messages/${friendId}`,
        );

        if (cancelled) return;

        setMessages(data.messages);
        await apiClient.put(`/api/messages/seen/${friendId}`);

        if (!cancelled && socket) {
          socket.emit("seen", { from: userId, to: friendId });
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Unable to load messages");
        }
      }
    }

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, [currentUserId, hydrated, selectedFriendId, setMessages, socket]);

  const handleReceiveMessage = useEffectEvent((message: MessageDto) => {
    if (message.senderId === selectedFriendId || message.receiverId === selectedFriendId) {
      addMessage(message);
    }
  });

  const handleTyping = useEffectEvent(({ from, isTyping }: { from: string; isTyping: boolean }) => {
    if (from === selectedFriendId) {
      setTyping(isTyping);
    }
  });

  const handleSeen = useEffectEvent(({ from }: { from: string }) => {
    if (from === selectedFriendId) {
      markMessagesRead(from);
    }
  });

  useEffect(() => {
    if (!socket) return;
    const receiveMessage = (message: MessageDto) => handleReceiveMessage(message);
    const typingListener = (payload: { from: string; isTyping: boolean }) => handleTyping(payload);
    const seenListener = (payload: { from: string }) => handleSeen(payload);

    socket.on("receive_message", receiveMessage);
    socket.on("user_typing", typingListener);
    socket.on("message_seen", seenListener);

    return () => {
      socket.off("receive_message", receiveMessage);
      socket.off("user_typing", typingListener);
      socket.off("message_seen", seenListener);
    };
  }, [socket]);

  async function sendMessage(payload: { text?: string; fileUrl?: string; fileType?: string }) {
    if (!selectedFriend) return;
    const data = await apiClient.post<{ success: true; message: MessageDto }>("/api/messages/send", {
      receiverId: selectedFriend.id,
      text: payload.text,
      fileUrl: payload.fileUrl ?? null,
      fileType: payload.fileType ?? null,
    });
    addMessage(data.message);
    socket?.emit("send_message", { to: selectedFriend.id, message: data.message });
  }

  function handleTypingChange(isTyping: boolean) {
    if (!selectedFriend || !currentUser) return;
    socket?.emit("typing", {
      from: currentUser.id,
      to: selectedFriend.id,
      isTyping,
    });
  }

  return (
    <ProtectedShell title="Chat">
      <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-4 overflow-hidden md:flex-row">
        <aside
          className={cn(
            "min-h-0 md:flex md:w-80 md:flex-shrink-0 md:flex-col",
            selectedFriend ? "hidden md:flex" : "flex",
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="rounded-[1.5rem] bg-white p-3 sm:p-4">
              <p className="font-display text-base font-semibold sm:text-lg">Discover</p>
              <p className="mb-4 text-sm text-[var(--muted)] sm:text-base">
                Search new people to add.
              </p>
              <FriendSearch />
            </div>

            <div className="flex min-h-[50vh] flex-1 flex-col rounded-[1.5rem] bg-white p-3 sm:p-4">
              <p className="font-display text-base font-semibold sm:text-lg">Friends</p>
              <p className="mb-4 text-sm text-[var(--muted)] sm:text-base">
                Your active conversations list.
              </p>
              {friends.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <EmptyState title="No chats yet" description="Add friends to start a conversation." />
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <ChatSidebar
                    friends={friends}
                    onlineUserIds={onlineUserIds}
                    selectedFriendId={selectedFriend?.id}
                    onSelect={setSelectedFriend}
                  />
                </div>
              )}
            </div>
          </div>
        </aside>

        <div
          className={cn(
            "min-h-[65vh] min-w-0 flex-1",
            selectedFriend ? "flex" : "hidden md:flex",
          )}
        >
          {selectedFriend ? (
            <ChatWindow
              currentUserId={currentUser?.id ?? ""}
              selectedFriend={selectedFriend}
              onlineUserIds={onlineUserIds}
              messages={messages}
              typing={typing}
              onBack={() => setSelectedFriend(null)}
              onSend={sendMessage}
              onTypingChange={handleTypingChange}
            />
          ) : (
            <div className="hidden flex-1 md:flex">
              <ChatWindow
                currentUserId={currentUser?.id ?? ""}
                selectedFriend={null}
                onlineUserIds={onlineUserIds}
                messages={messages}
                typing={typing}
                onBack={() => setSelectedFriend(null)}
                onSend={sendMessage}
                onTypingChange={handleTypingChange}
              />
            </div>
          )}
        </div>
      </div>
    </ProtectedShell>
  );
}
