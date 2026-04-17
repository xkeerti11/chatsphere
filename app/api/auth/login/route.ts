import { NextRequest } from "next/server";
import { fail, ok, readJson } from "@/lib/api";
import { generateToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { serializeUser, verifyPassword } from "@/lib/auth";
import { LOGIN_PASSWORD_INCORRECT_MESSAGE, loginSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for") ?? "local-login";
  if (!checkRateLimit(key)) {
    return fail("Too many login attempts. Please try again later.", 429);
  }

  const body = await readJson(request);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user) {
    return fail(LOGIN_PASSWORD_INCORRECT_MESSAGE, 401);
  }

  if (!user.isVerified) {
    return fail("Please verify your email first", 403);
  }

  const isValid = await verifyPassword(parsed.data.password, user.password);

  if (!isValid) {
    return fail(LOGIN_PASSWORD_INCORRECT_MESSAGE, 401);
  }

  const token = generateToken(user.id);
  const safeUser = serializeUser(user);

  return ok({
    success: true,
    token,
    user: {
      ...safeUser,
      id: user.id,
    },
  });
}
