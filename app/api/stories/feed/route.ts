import { NextRequest } from "next/server";
import { authenticateRequest, unauthorized } from "@/lib/auth";
import { ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return unauthorized(auth.error, auth.status);

  const friendRequests = await prisma.friendRequest.findMany({
    where: {
      OR: [
        { senderId: auth.user.id, status: "accepted" },
        { receiverId: auth.user.id, status: "accepted" },
      ],
    },
    select: {
      senderId: true,
      receiverId: true,
    },
  });

  const friendIds = friendRequests.map((item) =>
    item.senderId === auth.user.id ? item.receiverId : item.senderId,
  );
  const relevantIds = [auth.user.id, ...friendIds];

  const stories = await prisma.story.findMany({
    where: {
      userId: { in: relevantIds },
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profilePic: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const grouped = stories.reduce<
    Record<
      string,
      {
        user: {
          id: string;
          username: string;
          displayName: string | null;
          profilePic: string | null;
        };
        stories: Array<{
          id: string;
          mediaUrl: string;
          mediaType: string;
          caption: string | null;
          expiresAt: string;
          createdAt: string;
        }>;
      }
    >
  >((accumulator, story) => {
    if (!accumulator[story.userId]) {
      accumulator[story.userId] = {
        user: story.user,
        stories: [],
      };
    }

    accumulator[story.userId].stories.push({
      id: story.id,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      caption: story.caption,
      expiresAt: story.expiresAt.toISOString(),
      createdAt: story.createdAt.toISOString(),
    });

    return accumulator;
  }, {});

  return ok({
    success: true,
    stories: Object.values(grouped),
  });
}
