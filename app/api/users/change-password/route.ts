import { NextRequest } from "next/server";
import { authenticateRequest, unauthorized, verifyPassword, hashPassword } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return unauthorized(auth.error, auth.status);

  const body = await readJson(request);
  const parsed = changePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid password payload");
  }

  const isValid = await verifyPassword(parsed.data.currentPassword, auth.user.password);
  if (!isValid) {
    return fail("Current password is incorrect");
  }

  await prisma.user.update({
    where: { id: auth.user.id },
    data: { password: await hashPassword(parsed.data.newPassword) },
  });

  return ok({
    success: true,
    message: "Password changed successfully",
  });
}
