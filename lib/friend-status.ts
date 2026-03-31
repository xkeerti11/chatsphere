export const FriendStatus = {
  pending: "pending",
  accepted: "accepted",
  rejected: "rejected",
} as const;

export type FriendStatus = (typeof FriendStatus)[keyof typeof FriendStatus];
