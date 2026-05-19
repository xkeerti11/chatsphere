"use client";

import { useEffect, useRef } from "react";
import { Phone } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { useWebRTC } from "@/hooks/useWebRTC";
import { IncomingCallPopup } from "@/components/call/IncomingCallPopup";
import { ActiveCallScreen } from "@/components/call/ActiveCallScreen";
import { useSocketStore } from "@/stores/useSocketStore";
import { useAuthStore } from "@/stores/useAuthStore";
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
  const socket = useSocketStore(state => state.socket);
  const currentUser = useAuthStore(state => state.user);

  const {
    callState,
    remoteName,
    remotePic,
    incomingCall,
    isMuted,
    callDuration,
    remoteAudioRef,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    handleIncomingCall,
    handleCallAccepted,
    handleCallRejected,
    handleCallEnded,
    handleIceCandidate,
    handleUnavailable,
  } = useWebRTC({
    socket,
    currentUserId: currentUser?.id ?? "",
    currentUserName: currentUser?.displayName 
      ?? currentUser?.username ?? "",
    currentUserPic: currentUser?.profilePic ?? undefined,
  });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (!socket) return;

    socket.on("call:incoming", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("call:rejected", handleCallRejected);
    socket.on("call:ended", handleCallEnded);
    socket.on("call:ice-candidate", handleIceCandidate);
    socket.on("call:unavailable", handleUnavailable);

    return () => {
      socket.off("call:incoming", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("call:rejected", handleCallRejected);
      socket.off("call:ended", handleCallEnded);
      socket.off("call:ice-candidate", handleIceCandidate);
      socket.off("call:unavailable", handleUnavailable);
    };
  }, [socket, handleIncomingCall, handleCallAccepted,
      handleCallRejected, handleCallEnded, 
      handleIceCandidate, handleUnavailable]);

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
        <button
          onClick={() => selectedFriend && startCall(
            selectedFriend.id,
            selectedFriend.displayName ?? selectedFriend.username,
            selectedFriend.profilePic ?? undefined
          )}
          disabled={callState !== "idle" || !selectedFriend}
          className="p-2 rounded-full hover:bg-gray-100 
          transition-colors disabled:opacity-40
          text-gray-600 hover:text-green-600
          active:scale-95"
          title="Audio call"
        >
          <Phone size={20} />
        </button>
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

      {/* Incoming call popup */}
      {callState === "incoming" && incomingCall && (
        <IncomingCallPopup
          callerName={remoteName}
          callerPic={remotePic}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {/* Active call screen */}
      {(callState === "calling" || 
        callState === "connected" || 
        callState === "ended") && (
        <ActiveCallScreen
          callState={callState}
          remoteName={remoteName}
          remotePic={remotePic}
          isMuted={isMuted}
          callDuration={callDuration}
          onMute={toggleMute}
          onEnd={endCall}
          remoteAudioRef={remoteAudioRef}
        />
      )}
    </div>
  );
}
