import { NextRequest } from "next/server";
import { authenticateRequest, unauthorized } from "@/lib/auth";
import { ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ senderId: string }> },
) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return unauthorized(auth.error, auth.status);

  const { senderId } = await context.params;

  const result = await prisma.message.updateMany({
    where: {
      senderId,
      receiverId: auth.user.id,
      isRead: false,
    },
    data: {
      isRead: true,
      seenAt: new Date(),
    },
  });

  return ok({
    success: true,
    updatedCount: result.count,
  });
}
