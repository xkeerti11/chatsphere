import { NextRequest } from "next/server";
import { fail, ok, readJson } from "@/lib/api";
import { generateRandomToken } from "@/lib/auth";
import { VERIFY_TOKEN_EXPIRY_HOURS } from "@/lib/constants";
import { getOptionalEnv } from "@/lib/env";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { resendVerificationSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await readJson(request);
  const parsed = resendVerificationSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Invalid email address");
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user) {
    return ok({
      success: true,
      message: "If the account exists, a verification email has been sent.",
    });
  }

  if (user.isVerified) {
    return fail("Account is already verified");
  }

  const verifyToken = generateRandomToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      verifyToken,
      verifyTokenExpiry: new Date(Date.now() + VERIFY_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000),
    },
  });

  const appUrl = getOptionalEnv("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000";
  await sendVerificationEmail({
    email: user.email,
    username: user.username,
    verificationUrl: `${appUrl}/verify-email?token=${verifyToken}`,
  });

  return ok({
    success: true,
    message: "Verification email sent.",
  });
}
