import { NextRequest } from "next/server";
import { authenticateRequest, unauthorized } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type BlockBody = {
  userId?: string;
  action?: "block" | "unblock";
};

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return unauthorized(auth.error, auth.status);

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return fail("User id is required");
  if (userId === auth.user.id) return fail("You cannot block yourself");

  const existingBlock = await prisma.block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: auth.user.id,
        blockedId: userId,
      },
    },
  });

  return ok({
    success: true,
    isBlocked: Boolean(existingBlock),
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return unauthorized(auth.error, auth.status);

  const body = await readJson<BlockBody>(request);
  const userId = body.userId?.trim();
  const action = body.action;

  if (!userId) return fail("User id is required");
  if (action !== "block" && action !== "unblock") return fail("Invalid action");
  if (userId === auth.user.id) return fail("You cannot block yourself");

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!targetUser) return fail("User not found", 404);

  if (action === "block") {
    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: auth.user.id,
          blockedId: userId,
        },
      },
    });

    if (!existingBlock) {
      await prisma.block.create({
        data: {
          blockerId: auth.user.id,
          blockedId: userId,
        },
      });
    }

    return ok({
      success: true,
      isBlocked: true,
    });
  }

  await prisma.block.deleteMany({
    where: {
      blockerId: auth.user.id,
      blockedId: userId,
    },
  });

  return ok({
    success: true,
    isBlocked: false,
  });
}
