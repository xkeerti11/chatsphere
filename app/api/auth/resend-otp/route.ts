import { NextRequest, NextResponse } from "next/server";
import { buildAppUrl } from "@/lib/app-url";
import { generateRandomToken } from "@/lib/auth";
import { VERIFY_TOKEN_EXPIRY_HOURS } from "@/lib/constants";
import { sendVerificationEmail } from "@/lib/email";
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

    const token = generateRandomToken();
    const expires = new Date(Date.now() + VERIFY_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.verificationToken.upsert({
        where: { email: normalizedEmail },
        update: { token, expires },
        create: { email: normalizedEmail, token, expires },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          verifyToken: token,
          verifyTokenExpiry: expires,
        },
      }),
    ]);

    await sendVerificationEmail({
      email: user.email,
      username: user.username,
      verificationUrl: buildAppUrl(`/verify-email?token=${token}`, request.headers),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Verification email sent",
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
