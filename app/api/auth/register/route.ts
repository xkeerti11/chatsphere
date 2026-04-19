import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { buildAppUrl } from "@/lib/app-url";
import { generateRandomToken } from "@/lib/auth";
import { VERIFY_TOKEN_EXPIRY_HOURS } from "@/lib/constants";
import { sendVerificationEmail } from "@/lib/email";
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

    const verifyToken = generateRandomToken();
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        isVerified: false,
        verifyToken,
        verifyTokenExpiry: new Date(Date.now() + VERIFY_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000),
      },
    });

    await sendVerificationEmail({
      email: user.email,
      username: user.username,
      verificationUrl: buildAppUrl(`/verify-email?token=${verifyToken}`, request.headers),
    });

    return NextResponse.json(
      { success: true, message: "Account created! Check your email to verify your account." },
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
