import { NextRequest } from "next/server";
import { authenticateRequest, unauthorized } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { toFriendStatusView } from "@/lib/relations";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return unauthorized(auth.error, auth.status);

  const query = request.nextUrl.searchParams.get("username")?.trim() ?? "";
  if (query.length < 2) {
    return fail("Search query must be at least 2 characters");
  }

  const users = await prisma.user.findMany({
    where: {
      id: { not: auth.user.id },
      username: { contains: query.toLowerCase(), mode: "insensitive" },
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      profilePic: true,
      bio: true,
      email: true,
      isVerified: true,
      isOnline: true,
      lastSeen: true,
      createdAt: true,
    },
    take: 10,
  });

  const ids = users.map((item) => item.id);
  const relationships = await prisma.friendRequest.findMany({
    where: {
      OR: [
        { senderId: auth.user.id, receiverId: { in: ids } },
        { receiverId: auth.user.id, senderId: { in: ids } },
      ],
    },
  });

  return ok({
    success: true,
    users: users.map((user) => {
      const relation = relationships.find(
        (item) =>
          (item.senderId === auth.user.id && item.receiverId === user.id) ||
          (item.receiverId === auth.user.id && item.senderId === user.id),
      );

      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        profilePic: user.profilePic,
        friendStatus: toFriendStatusView(relation, auth.user.id),
      };
    }),
  });
}
