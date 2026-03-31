import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, serializeUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if ("error" in auth) return unauthorized(auth.error, auth.status);

    const friendships = await prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: auth.user.id, status: "accepted" },
          { receiverId: auth.user.id, status: "accepted" },
        ],
      },
      include: {
        sender: {
          select: {
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
          },
        },
        receiver: {
          select: {
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
          },
        },
      },
    });

    const friends = friendships.map((item: any) => {
      const friend = item.senderId === auth.user.id ? item.receiver : item.sender;

      return {
        ...serializeUser(friend),
        friendshipId: item.id,
        friendshipStatus: item.status,
      };
    });

    return NextResponse.json({
      success: true,
      friends,
    });
  } catch (error) {
    console.error("GET /api/friends/list failed", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load friends",
      },
      { status: 500 },
    );
  }
}
