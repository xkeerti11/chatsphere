import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and OTP required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ success: true, message: "Already verified" });
    }

    if (user.verifyToken !== otp) {
      return NextResponse.json({ success: false, error: "Invalid OTP" }, { status: 400 });
    }

    if (!user.verifyTokenExpiry || user.verifyTokenExpiry < new Date()) {
      return NextResponse.json(
        { success: false, error: "OTP expired. Request new one." },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        isVerified: true,
        verifyToken: null,
        verifyTokenExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Email verified! You can now login.",
    });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json(
      { success: false, error: "Verification failed" },
      { status: 500 },
    );
  }
}
