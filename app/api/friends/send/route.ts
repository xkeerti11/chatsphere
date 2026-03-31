import { NextRequest } from "next/server";
import { authenticateRequest, unauthorized } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";
import { FriendStatus } from "@/lib/friend-status";
import { prisma } from "@/lib/prisma";
import { friendSendSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return unauthorized(auth.error, auth.status);

  const body = await readJson(request);
  const parsed = friendSendSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid receiver");

  const receiverId = parsed.data.receiverId;
  if (receiverId === auth.user.id) return fail("You cannot add yourself");

  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) return fail("User not found", 404);

  const existing = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId: auth.user.id, receiverId },
        { senderId: receiverId, receiverId: auth.user.id },
      ],
    },
  });

  if (existing?.status === FriendStatus.accepted) {
    return fail("You are already friends");
  }

  if (existing?.status === FriendStatus.pending) {
    return fail("Friend request already sent", 409);
  }

  if (
    existing?.status === FriendStatus.rejected &&
    existing.senderId === auth.user.id &&
    existing.receiverId === receiverId
  ) {
    const requestRecord = await prisma.friendRequest.update({
      where: { id: existing.id },
      data: { status: FriendStatus.pending },
    });

    return ok(
      {
        success: true,
        message: "Friend request sent",
        request: requestRecord,
      },
      201,
    );
  }

  const requestRecord = await prisma.friendRequest.create({
    data: {
      senderId: auth.user.id,
      receiverId,
      status: FriendStatus.pending,
    },
  });

  return ok(
    {
      success: true,
      message: "Friend request sent",
      request: requestRecord,
    },
    201,
  );
}
