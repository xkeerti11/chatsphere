import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { authenticateRequest, serializeUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type FriendUser = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  profilePic: string | null;
  bio: string | null;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: Date | null;
  createdAt: Date;
};

type FriendshipWithUsers = {
  id: string;
  senderId: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  sender: FriendUser;
  receiver: FriendUser;
};

const friendUserSelect = {
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
} satisfies Prisma.UserSelect;

const friendshipInclude = {
  sender: {
    select: friendUserSelect,
  },
  receiver: {
    select: friendUserSelect,
  },
} satisfies Prisma.FriendRequestInclude;

type FriendshipResult = Prisma.FriendRequestGetPayload<{
  include: typeof friendshipInclude;
}>;

type FriendListItem = ReturnType<typeof serializeUser> & {
  friendshipId: string;
  friendshipStatus: FriendshipWithUsers["status"];
};

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if ("error" in auth) return unauthorized(auth.error, auth.status);

    let blocks: Array<{ blockerId: string; blockedId: string }> = [];
    try {
      blocks = await prisma.block.findMany({
        where: {
          OR: [{ blockerId: auth.user.id }, { blockedId: auth.user.id }],
        },
        select: {
          blockerId: true,
          blockedId: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2021"
      ) {
        console.warn("Block model table missing");
      } else {
        throw error;
      }
    }

    const blockedIds = blocks.map((item) =>
      item.blockerId === auth.user.id ? item.blockedId : item.blockerId,
    );

    let friendships: FriendshipResult[] = [];
    try {
      friendships = await prisma.friendRequest.findMany({
        where: {
          OR: [
            { senderId: auth.user.id, status: "accepted" },
            { receiverId: auth.user.id, status: "accepted" },
          ],
        },
        include: friendshipInclude,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2021"
      ) {
        console.warn("FriendRequest model table missing");
        return NextResponse.json({ success: true, friends: [] });
      } else {
        throw error;
      }
    }

    const friends = friendships
      .map((item): FriendListItem => {
        const friend = item.senderId === auth.user.id ? item.receiver : item.sender;

        return {
          ...serializeUser(friend),
          friendshipId: item.id,
          friendshipStatus: item.status,
        };
      })
      .filter((friend) => !blockedIds.includes(friend.id));

    return NextResponse.json<{ success: true; friends: FriendListItem[] }>({
      success: true,
      friends,
    });
  } catch (error) {
    console.error("GET /api/friends/list failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 },
    );
  }
}
