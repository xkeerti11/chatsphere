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

    try {
      const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
      await fetch(`${socketServerUrl}/notify-friend-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: receiverId,
          from: {
            id: auth.user.id,
            username: auth.user.username,
            displayName: auth.user.displayName,
            profilePic: auth.user.profilePic,
          },
        }),
      });
    } catch (e) {
      console.log("Socket notify failed:", e);
    }

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

  try {
    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    await fetch(`${socketServerUrl}/notify-friend-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: receiverId,
        from: {
          id: auth.user.id,
          username: auth.user.username,
          displayName: auth.user.displayName,
          profilePic: auth.user.profilePic,
        },
      }),
    });
  } catch (e) {
    console.log("Socket notify failed:", e);
  }

  return ok(
    {
      success: true,
      message: "Friend request sent",
      request: requestRecord,
    },
    201,
  );
}
