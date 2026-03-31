import { NextRequest } from "next/server";
import { authenticateRequest, unauthorized } from "@/lib/auth";
import { ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return unauthorized(auth.error, auth.status);

  const requests = await prisma.friendRequest.findMany({
    where: {
      receiverId: auth.user.id,
      status: "pending",
    },
    include: {
      sender: {
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

  return ok({
    success: true,
    requests,
  });
}
