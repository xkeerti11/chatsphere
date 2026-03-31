import jwt, { type SignOptions } from "jsonwebtoken";
import { getEnv } from "@/lib/env";

const JWT_SECRET = () => getEnv("JWT_SECRET");
const JWT_EXPIRES_IN = () => getEnv("JWT_EXPIRES_IN", "7d");

export type JwtPayload = {
  userId: string;
};

export function generateToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET(), {
    expiresIn: JWT_EXPIRES_IN() as SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET()) as JwtPayload;
  } catch {
    return null;
  }
}
