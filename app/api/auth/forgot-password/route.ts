import { NextRequest } from "next/server";
import { ok, readJson } from "@/lib/api";
import { generateOtp, hashOtp } from "@/lib/auth";
import { RESET_OTP_EXPIRY_MINUTES } from "@/lib/constants";
import { sendResetOtpEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await readJson(request);
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return ok({
      success: true,
      message: "If the account exists, a reset code has been sent.",
    });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user) {
    return ok({
      success: true,
      message: "If the account exists, a reset code has been sent.",
    });
  }

  const otp = generateOtp();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetOtpHash: hashOtp(otp),
      resetOtpExpiry: new Date(Date.now() + RESET_OTP_EXPIRY_MINUTES * 60 * 1000),
      resetOtpAttempts: 0,
    },
  });

  await sendResetOtpEmail({ email: user.email, otp });

  return ok({
    success: true,
    message: "If the account exists, a reset code has been sent.",
  });
}
