"use client";

import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { FriendSearch } from "@/components/friends/FriendSearch";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/client-api";
import type { FriendListItem, MessageDto } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useSocketStore } from "@/stores/useSocketStore";

type UnreadMessageMap = Record<string, number>;

const CHAT_UNREAD_KEY = "chatsphere:unreadMessagesByFriend";
const ACTIVE_CHAT_FRIEND_KEY = "chatsphere:activeChatFriendId";
const CHAT_UNREAD_EVENT = "chatsphere:unreadMessagesChanged";

function readUnreadMessageMap(): UnreadMessageMap {
  if (typeof window === "undefined") return {};

  try {
    const value = window.localStorage.getItem(CHAT_UNREAD_KEY);
    if (!value) return {};

    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") return {};

    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        ([, count]) => typeof count === "number" && count > 0,
      ),
    ) as UnreadMessageMap;
  } catch {
    return {};
  }
}

function writeUnreadMessageMap(unreadMap: UnreadMessageMap) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(CHAT_UNREAD_KEY, JSON.stringify(unreadMap));
  window.dispatchEvent(new CustomEvent(CHAT_UNREAD_EVENT, { detail: unreadMap }));
}

export function ChatWorkspace() {
  const router = useRouter();
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
  const [unreadMap, setUnreadMap] = useState<UnreadMessageMap>(() => readUnreadMessageMap());
  const selectedFriendId = selectedFriend?.id ?? null;
  const loadedFriendsForUserRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUnreadForFriend = useCallback((friendId: string) => {
    setUnreadMap((prev) => {
      if (!prev[friendId]) return prev;

      const next = { ...prev };
      delete next[friendId];
      writeUnreadMessageMap(next);
      return next;
    });
  }, []);

  const loadFriends = useEffectEvent(async () => {
    try {
      const data = await apiClient.get<{ success: true; friends: FriendListItem[] }>("/api/friends/list");
      const onlineIds = new Set(onlineUserIds);

      setFriends(
        data.friends.map((friend) => ({
          ...friend,
          isOnline: isSocketConnected ? onlineIds.has(friend.id) : friend.isOnline,
        })),
      );

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
    if (!socket || !currentUserId || !isSocketConnected) return;
    socket.emit("join", { userId: currentUserId });
  }, [currentUserId, isSocketConnected, socket]);

  useEffect(() => {
    const handleUnreadChanged = (event: Event) => {
      const nextUnreadMap = (event as CustomEvent<UnreadMessageMap>).detail;
      setUnreadMap(nextUnreadMap ?? readUnreadMessageMap());
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === CHAT_UNREAD_KEY) {
        setUnreadMap(readUnreadMessageMap());
      }
    };

    window.addEventListener(CHAT_UNREAD_EVENT, handleUnreadChanged);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(CHAT_UNREAD_EVENT, handleUnreadChanged);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (selectedFriendId) {
      window.localStorage.setItem(ACTIVE_CHAT_FRIEND_KEY, selectedFriendId);
    } else {
      window.localStorage.removeItem(ACTIVE_CHAT_FRIEND_KEY);
    }

    return () => {
      window.localStorage.removeItem(ACTIVE_CHAT_FRIEND_KEY);
    };
  }, [selectedFriendId]);

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
        clearUnreadForFriend(friendId);
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
  }, [clearUnreadForFriend, currentUserId, hydrated, selectedFriendId, setMessages, socket]);

  const handleReceiveMessage = useEffectEvent((message: MessageDto) => {
    if (message.senderId === selectedFriendId || message.receiverId === selectedFriendId) {
      addMessage(message);

      if (message.senderId === selectedFriendId && currentUserId) {
        void (async () => {
          try {
            await apiClient.put(`/api/messages/seen/${selectedFriendId}`);
            socket?.emit("seen", { from: currentUserId, to: selectedFriendId, messageId: message.id });
          } catch {
            // Keep receiving messages even if the read receipt update fails.
          }
        })();
      }
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
    const userOnlineListener = ({ userId }: { userId: string }) => {
      setFriends((currentFriends) =>
        currentFriends.map((friend) =>
          friend.id === userId ? { ...friend, isOnline: true } : friend,
        ),
      );
    };
    const userOfflineListener = ({ userId }: { userId: string }) => {
      setFriends((currentFriends) =>
        currentFriends.map((friend) =>
          friend.id === userId ? { ...friend, isOnline: false } : friend,
        ),
      );
    };
    const presenceSnapshotListener = ({ userIds }: { userIds: string[] }) => {
      setFriends((currentFriends) =>
        currentFriends.map((friend) => ({
          ...friend,
          isOnline: userIds.includes(friend.id),
        })),
      );
    };

    socket.on("receive_message", receiveMessage);
    socket.on("user_typing", typingListener);
    socket.on("message_seen", seenListener);
    socket.on("user_online", userOnlineListener);
    socket.on("user_offline", userOfflineListener);
    socket.on("presence_snapshot", presenceSnapshotListener);

    return () => {
      socket.off("receive_message", receiveMessage);
      socket.off("user_typing", typingListener);
      socket.off("message_seen", seenListener);
      socket.off("user_online", userOnlineListener);
      socket.off("user_offline", userOfflineListener);
      socket.off("presence_snapshot", presenceSnapshotListener);
    };
  }, [setFriends, socket]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

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

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    socket?.emit("typing", {
      from: currentUser.id,
      to: selectedFriend.id,
      isTyping,
    });

    if (!isTyping) return;

    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit("typing", {
        from: currentUser.id,
        to: selectedFriend.id,
        isTyping: false,
      });
      typingTimeoutRef.current = null;
    }, 2000);
  }

  function handleBack() {
    if (friendParam) {
      router.back();
      return;
    }

    setTyping(false);
    setSelectedFriend(null);
  }

  function handleSelectFriend(friend: FriendListItem) {
    setTyping(false);
    clearUnreadForFriend(friend.id);
    setSelectedFriend(friend);
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
                  <div className="space-y-2 sm:space-y-3">
                    {friends.map((friend) => {
                      const isOnline = friend.isOnline || onlineUserIds.includes(friend.id);
                      const unreadCount = unreadMap[friend.id] ?? 0;

                      return (
                        <button
                          key={friend.id}
                          className={cn(
                            "relative flex min-h-[44px] w-full items-center gap-3 rounded-xl p-3 text-left transition-colors",
                            selectedFriendId === friend.id
                              ? "bg-[var(--brand-soft)]"
                              : "bg-white hover:bg-gray-50",
                          )}
                          onClick={() => handleSelectFriend(friend)}
                        >
                          <div className="relative flex-shrink-0">
                            <Avatar
                              name={friend.displayName ?? friend.username}
                              src={friend.profilePic}
                              size="md"
                              className="h-10 w-10 sm:h-12 sm:w-12"
                            />
                            {isOnline ? (
                              <span className="absolute bottom-0 right-0 z-10 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className={cn(
                                  "truncate text-sm sm:text-base",
                                  unreadCount > 0
                                    ? "font-bold text-gray-900"
                                    : "font-medium text-gray-700",
                                )}
                              >
                                {friend.displayName ?? friend.username}
                              </p>
                              {unreadCount > 0 ? (
                                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-medium text-white">
                                  {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                              ) : (
                                <span className="shrink-0 text-[10px] text-[var(--muted)] sm:text-xs">
                                  {formatRelativeTime(friend.lastSeen)}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-xs">
                              {isOnline ? (
                                <span className="font-medium text-green-500">Online</span>
                              ) : (
                                <span className={unreadCount > 0 ? "font-medium text-blue-500" : "text-gray-400"}>
                                  Offline
                                </span>
                              )}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
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
              onBack={handleBack}
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
                onBack={handleBack}
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
