import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { sendOTPEmail } from "@/lib/email";
import prisma from "@/lib/prisma";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[A-Za-z0-9_]{3,20}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const rawUsername = typeof body?.username === "string" ? body.username.trim() : "";
    const username = rawUsername.toLowerCase();
    const password = typeof body?.password === "string" ? body.password : "";

    console.log("Register attempt:", email);

    if (!email || !rawUsername || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "All fields required",
          message: "All fields required",
        },
        { status: 400 },
      );
    }

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid email address.",
          message: "Please enter a valid email address.",
        },
        { status: 400 },
      );
    }

    if (!usernameRegex.test(rawUsername)) {
      return NextResponse.json(
        {
          success: false,
          error: "Username must be 3-20 characters and contain only letters, numbers, and underscores.",
          message: "Username must be 3-20 characters and contain only letters, numbers, and underscores.",
        },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be 8+ characters",
          message: "Password must be 8+ characters",
        },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      const duplicateError =
        existingUser.email === email ? "Email already registered" : "Username already taken";

      return NextResponse.json(
        {
          success: false,
          error: duplicateError,
          message: duplicateError,
        },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        isVerified: false,
        verifyToken: otp,
        verifyTokenExpiry: otpExpiry,
      },
    });

    await sendOTPEmail(user.email, otp, user.username);

    return NextResponse.json(
      {
        success: true,
        message: "OTP sent to your email",
        redirectTo: `/verify-email?email=${encodeURIComponent(user.email)}`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to create account. Try again.",
        message: "Unable to create account. Try again.",
      },
      { status: 500 },
    );
  }
}
