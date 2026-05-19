import type { AppNotification, MessageDto } from "@/lib/types";

export type TypingPayload = {
  from: string;
  to: string;
  isTyping: boolean;
};

export type SeenPayload = {
  messageId?: string;
  from: string;
  to: string;
};

export type JoinPayload = {
  userId: string;
};

export type ServerToClientEvents = {
  presence_snapshot: (payload: { userIds: string[] }) => void;
  receive_message: (message: MessageDto) => void;
  new_notification: (payload: AppNotification) => void;
  user_typing: (payload: TypingPayload) => void;
  message_seen: (payload: SeenPayload) => void;
  user_online: (payload: { userId: string }) => void;
  user_offline: (payload: { userId: string }) => void;
  "call:incoming": (data: {
    from: string;
    callerName: string;
    callerPic?: string;
    offer: RTCSessionDescriptionInit;
  }) => void;
  "call:accepted": (data: {
    answer: RTCSessionDescriptionInit;
  }) => void;
  "call:rejected": () => void;
  "call:ended": () => void;
  "call:ice-candidate": (data: {
    candidate: RTCIceCandidateInit;
  }) => void;
  "call:unavailable": (data: {
    userId: string;
  }) => void;
};

export type ClientToServerEvents = {
  join: (payload: JoinPayload) => void;
  send_message: (payload: { to: string; message: MessageDto }) => void;
  typing: (payload: TypingPayload) => void;
  seen: (payload: SeenPayload) => void;
  "call:initiate": (data: {
    to: string;
    from: string;
    offer: RTCSessionDescriptionInit;
    callerName: string;
    callerPic?: string;
  }) => void;
  "call:accept": (data: {
    to: string;
    answer: RTCSessionDescriptionInit;
  }) => void;
  "call:reject": (data: { to: string }) => void;
  "call:end": (data: { to: string }) => void;
  "call:ice-candidate": (data: {
    to: string;
    candidate: RTCIceCandidateInit;
  }) => void;
};
