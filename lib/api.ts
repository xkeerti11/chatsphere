import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function readJson<T>(request: NextRequest): Promise<T> {
  return (await request.json()) as T;
}

export function ok<T>(body: T, status = 200) {
  return NextResponse.json(body, { status });
}

export function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}
