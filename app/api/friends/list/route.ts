import { NextRequest, NextResponse } from "next/server";
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
};

const friendshipInclude = {
  sender: {
    select: friendUserSelect,
  },
  receiver: {
    select: friendUserSelect,
  },
};

type FriendListItem = ReturnType<typeof serializeUser> & {
  friendshipId: string;
  friendshipStatus: FriendshipWithUsers["status"];
};

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
      include: friendshipInclude,
    });

    const friends = friendships.map((item: FriendshipWithUsers): FriendListItem => {
      const friend = item.senderId === auth.user.id ? item.receiver : item.sender;

      return {
        ...serializeUser(friend),
        friendshipId: item.id,
        friendshipStatus: item.status,
      };
    });

    return NextResponse.json<{ success: true; friends: FriendListItem[] }>({
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
