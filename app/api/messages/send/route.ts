import { NextRequest } from "next/server";
import { authenticateRequest, sanitizeText, unauthorized } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { areFriends } from "@/lib/relations";
import { messageSendSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return unauthorized(auth.error, auth.status);

  const body = await readJson(request);
  const parsed = messageSendSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid message payload");

  if (!(await areFriends(auth.user.id, parsed.data.receiverId))) {
    return fail("You can only message your friends", 403);
  }

  const text = parsed.data.text ? sanitizeText(parsed.data.text) : null;

  const message = await prisma.message.create({
    data: {
      senderId: auth.user.id,
      receiverId: parsed.data.receiverId,
      text,
      fileUrl: parsed.data.fileUrl ?? null,
      fileType: parsed.data.fileType ?? null,
    },
  });

  return ok(
    {
      success: true,
      message: {
        ...message,
        seenAt: message.seenAt?.toISOString() ?? null,
        createdAt: message.createdAt.toISOString(),
      },
    },
    201,
  );
}
