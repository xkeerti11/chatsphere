import { NextRequest, NextResponse } from "next/server";
import { sendOTPEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 400 },
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { success: false, error: "Account is already verified" },
        { status: 400 },
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        verifyToken: otp,
        verifyTokenExpiry: otpExpiry,
      },
    });

    await sendOTPEmail(user.email, otp, user.username);

    return NextResponse.json(
      {
        success: true,
        message: "New OTP sent to your email",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
