import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import type { SafeUser } from "@/lib/types";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword);
}

export function generateRandomToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function generateOtp() {
  return `${crypto.randomInt(100000, 1000000)}`;
}

export function hashOtp(otp: string) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export function sanitizeText(text: string) {
  return text.replace(/[<>]/g, "").trim();
}

export function serializeUser(user: {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  profilePic: string | null;
  bio: string | null;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: Date | null;
  createdAt?: Date;
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    profilePic: user.profilePic,
    bio: user.bio,
    isVerified: user.isVerified,
    isOnline: user.isOnline,
    lastSeen: user.lastSeen?.toISOString() ?? null,
    createdAt: user.createdAt?.toISOString(),
  };
}

export type AuthResult = { user: User } | { error: string; status: number };

export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    return { error: "No token provided", status: 401 as const };
  }

  const decoded = verifyToken(header.slice(7));

  if (!decoded) {
    return { error: "Invalid or expired token", status: 401 as const };
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) {
    return { error: "User not found", status: 401 as const };
  }

  if (!user.isVerified) {
    return { error: "Email not verified", status: 403 as const };
  }

  return { user };
}

export function unauthorized(error: string, status = 401) {
  return NextResponse.json({ success: false, error }, { status });
}
