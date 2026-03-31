import { NextRequest } from "next/server";
import { authenticateRequest, serializeUser, unauthorized } from "@/lib/auth";
import { ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return unauthorized(auth.error, auth.status);

  return ok({
    success: true,
    user: serializeUser(auth.user),
  });
}
