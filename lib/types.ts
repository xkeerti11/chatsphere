import type { FriendStatus } from "@prisma/client";

export type SafeUser = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  profilePic: string | null;
  bio: string | null;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: string | null;
  createdAt?: string;
};

export type FriendStatusView = "none" | "pending_sent" | "pending_received" | "accepted";

export type FriendListItem = SafeUser & {
  friendshipId?: string;
  friendshipStatus?: FriendStatus;
};

export type MessageDto = {
  id: string;
  senderId: string;
  receiverId: string;
  text: string | null;
  fileUrl: string | null;
  fileType: string | null;
  isRead: boolean;
  seenAt: string | null;
  createdAt: string;
};

export type StoryDto = {
  id: string;
  mediaUrl: string;
  mediaType: string;
  caption: string | null;
  expiresAt: string;
  createdAt: string;
};

export type StoryFeedGroup = {
  user: Pick<SafeUser, "id" | "username" | "displayName" | "profilePic">;
  stories: StoryDto[];
};
