import { NextRequest } from "next/server";
import { fail, ok, readJson } from "@/lib/api";
import { hashOtp, hashPassword } from "@/lib/auth";
import { RESET_OTP_MAX_ATTEMPTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await readJson(request);
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid reset payload");
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user || !user.resetOtpHash || !user.resetOtpExpiry) {
    return fail("Invalid or expired reset code");
  }

  if (user.resetOtpAttempts >= RESET_OTP_MAX_ATTEMPTS) {
    return fail("Too many invalid OTP attempts. Please request a new code.", 429);
  }

  if (user.resetOtpExpiry <= new Date()) {
    return fail("Invalid or expired reset code");
  }

  if (hashOtp(parsed.data.otp) !== user.resetOtpHash) {
    await prisma.user.update({
      where: { id: user.id },
      data: { resetOtpAttempts: { increment: 1 } },
    });
    return fail("Invalid or expired reset code");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await hashPassword(parsed.data.newPassword),
      resetOtpHash: null,
      resetOtpExpiry: null,
      resetOtpAttempts: 0,
    },
  });

  return ok({
    success: true,
    message: "Password reset successfully.",
  });
}
