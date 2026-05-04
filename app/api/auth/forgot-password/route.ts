import { NextRequest, NextResponse } from "next/server";
import { generateOtp, hashOtp } from "@/lib/auth";
import { RESET_OTP_EXPIRY_MINUTES } from "@/lib/constants";
import { sendResetOTPEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Email required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "No account found with this email",
        },
        { status: 404 },
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "Please verify your email first before resetting password",
          needsVerification: true,
          email: user.email,
        },
        { status: 403 },
      );
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

    await sendResetOTPEmail(user.email, otp);

    return NextResponse.json({
      success: true,
      message: "Password reset OTP sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 },
    );
  }
}
