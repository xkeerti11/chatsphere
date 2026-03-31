import { NextRequest } from "next/server";
import { authenticateRequest, unauthorized } from "@/lib/auth";
import { fail, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { areFriends } from "@/lib/relations";

export const runtime = "nodejs";

type MessageRecord = {
  id: string;
  senderId: string;
  receiverId: string;
  text: string | null;
  fileUrl: string | null;
  fileType: string | null;
  isRead: boolean;
  seenAt: Date | null;
  createdAt: Date;
};

export async function GET(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return unauthorized(auth.error, auth.status);

  const { userId } = await context.params;

  if (!(await areFriends(auth.user.id, userId))) {
    return fail("You can only view chat history with your friends", 403);
  }

  const page = Number(request.nextUrl.searchParams.get("page") ?? 1);
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 50), 100);
  const skip = (page - 1) * limit;

  const where = {
    OR: [
      { senderId: auth.user.id, receiverId: userId },
      { senderId: userId, receiverId: auth.user.id },
    ],
  };

  const [total, messages] = await Promise.all([
    prisma.message.count({ where }),
    prisma.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  const ordered = messages.reverse().map((message: MessageRecord) => ({
    ...message,
    seenAt: message.seenAt?.toISOString() ?? null,
    createdAt: message.createdAt.toISOString(),
  }));

  return ok({
    success: true,
    messages: ordered,
    pagination: {
      page,
      limit,
      total,
      hasMore: skip + limit < total,
    },
  });
}
