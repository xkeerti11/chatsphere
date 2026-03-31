import { NextRequest } from "next/server";
import { fail, ok, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { verifySchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await readJson(request);
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return fail("Invalid verification token");
  }

  const user = await prisma.user.findFirst({
    where: {
      verifyToken: parsed.data.token,
      verifyTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    return fail("Invalid or expired verification token");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verifyToken: null,
      verifyTokenExpiry: null,
    },
  });

  return ok({
    success: true,
    message: "Email verified successfully! You can now login.",
  });
}
