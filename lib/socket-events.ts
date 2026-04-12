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
};

export type ClientToServerEvents = {
  join: (payload: JoinPayload) => void;
  send_message: (payload: { to: string; message: MessageDto }) => void;
  typing: (payload: TypingPayload) => void;
  seen: (payload: SeenPayload) => void;
};
