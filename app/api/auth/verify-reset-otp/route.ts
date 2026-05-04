import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "Verify email first",
        },
        { status: 403 },
      );
    }

    if (user.verifyToken !== otp) {
      return NextResponse.json(
        { success: false, error: "Invalid OTP" },
        { status: 400 },
      );
    }

    if (!user.verifyTokenExpiry || user.verifyTokenExpiry < new Date()) {
      return NextResponse.json(
        { success: false, error: "OTP expired" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
