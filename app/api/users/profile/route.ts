import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, unauthorized } from "@/lib/auth";
import { fail, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { normalizeUsername } from "@/lib/utils";
import { profileUpdateSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return unauthorized(auth.error, auth.status);

  const body = await readJson(request);
  const parsed = profileUpdateSchema.safeParse(body);
  const user = auth.user;

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid profile input");
  }

  const username = parsed.data.username ? normalizeUsername(parsed.data.username) : undefined;

  if (username && username !== user.username) {
    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) return fail("Username already taken", 409);
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      displayName: parsed.data.displayName ?? undefined,
      username,
      bio: parsed.data.bio ?? undefined,
      profilePic: parsed.data.profilePic ?? undefined,
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      profilePic: true,
      bio: true,
    },
  });

  return NextResponse.json({ success: true, user: updatedUser });
}
