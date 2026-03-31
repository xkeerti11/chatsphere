import { NextRequest } from "next/server";
import { authenticateRequest, unauthorized } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";
import { FriendStatus } from "@/lib/friend-status";
import { prisma } from "@/lib/prisma";
import { friendRespondSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return unauthorized(auth.error, auth.status);

  const body = await readJson(request);
  const parsed = friendRespondSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid request payload");

  const friendRequest = await prisma.friendRequest.findUnique({
    where: { id: parsed.data.requestId },
  });

  if (!friendRequest) return fail("Friend request not found", 404);
  if (friendRequest.receiverId !== auth.user.id) return fail("Only receiver can respond", 403);

  const status = parsed.data.action === "accept" ? FriendStatus.accepted : FriendStatus.rejected;

  await prisma.friendRequest.update({
    where: { id: friendRequest.id },
    data: { status },
  });

  return ok({
    success: true,
    message: `Friend request ${parsed.data.action}ed`,
  });
}
