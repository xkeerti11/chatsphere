"use client";

import { useEffect, useRef } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import type { FriendListItem, MessageDto } from "@/lib/types";

export function ChatWindow({
  currentUserId,
  selectedFriend,
  onlineUserIds,
  messages,
  typing,
  onBack,
  onSend,
  onTypingChange,
}: {
  currentUserId: string;
  selectedFriend: FriendListItem | null;
  onlineUserIds: string[];
  messages: MessageDto[];
  typing: boolean;
  onBack: () => void;
  onSend: (payload: { text?: string; fileUrl?: string; fileType?: string }) => Promise<void>;
  onTypingChange: (isTyping: boolean) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  if (!selectedFriend) {
    return (
      <div className="flex h-full min-h-[65vh] w-full items-center justify-center rounded-[1.25rem] border border-[var(--border)] bg-white p-4">
        <EmptyState
          title="Pick a conversation"
          description="Select a friend from the list to start chatting."
        />
      </div>
    );
  }

  const isOnline = selectedFriend.isOnline || onlineUserIds.includes(selectedFriend.id);

  return (
    <div className="flex h-full min-h-[65vh] min-w-0 flex-1 flex-col overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-white">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--border)] bg-white p-3 sm:p-4">
        <button
          onClick={onBack}
          className="mr-2 flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-[var(--background-soft)] p-2.5 text-sm font-medium md:hidden"
          type="button"
        >
          ← Back
        </button>
        <Avatar
          name={selectedFriend.displayName ?? selectedFriend.username}
          src={selectedFriend.profilePic}
          size="sm"
          className="h-8 w-8 flex-shrink-0 sm:h-10 sm:w-10"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold sm:text-base">
            {selectedFriend.displayName ?? selectedFriend.username}
          </p>
          <p className="truncate text-xs text-[var(--muted)] sm:text-sm">
            {isOnline ? "Online" : "Last seen recently"}
          </p>
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto py-3 sm:py-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} currentUserId={currentUserId} message={message} />
        ))}
        {typing ? (
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="flex gap-1">
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className="text-xs text-gray-400">typing...</span>
          </div>
        ) : null}
      </div>

      <div className="border-t border-[var(--border)] bg-white p-2 sm:p-3">
        <MessageInput onSend={onSend} onTypingChange={onTypingChange} />
      </div>
    </div>
  );
}
