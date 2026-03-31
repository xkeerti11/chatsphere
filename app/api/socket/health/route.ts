import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch(`${socketUrl}/health`, {
      cache: "no-store",
      signal: controller.signal,
    });

    return NextResponse.json({
      available: response.ok,
    });
  } catch {
    return NextResponse.json({
      available: false,
    });
  } finally {
    clearTimeout(timeout);
  }
}
