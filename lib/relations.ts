import type { Prisma } from "@prisma/client";
import { FriendStatus, type FriendStatus as FriendStatusType } from "@/lib/friend-status";
import { prisma } from "@/lib/prisma";
import type { FriendStatusView } from "@/lib/types";

export async function areFriends(userId1: string, userId2: string) {
  const record = await prisma.friendRequest.findFirst({
    where: {
      status: FriendStatus.accepted,
      OR: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    },
  });

  return Boolean(record);
}

export async function getFriendIds(userId: string) {
  const friendships = await prisma.friendRequest.findMany({
    where: {
      status: FriendStatus.accepted,
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    select: { senderId: true, receiverId: true },
  });

  return friendships.map((item) => (item.senderId === userId ? item.receiverId : item.senderId));
}

export function toFriendStatusView(
  request:
    | {
        senderId: string;
        receiverId: string;
        status: FriendStatusType;
      }
    | null
    | undefined,
  currentUserId: string,
): FriendStatusView {
  if (!request) return "none";
  if (request.status === FriendStatus.accepted) return "accepted";
  return request.senderId === currentUserId ? "pending_sent" : "pending_received";
}

export const safeUserSelect = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  profilePic: true,
  bio: true,
  isVerified: true,
  isOnline: true,
  lastSeen: true,
  createdAt: true,
} satisfies Prisma.UserSelect;
