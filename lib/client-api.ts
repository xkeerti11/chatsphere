"use client";

import { STORAGE_KEY, useAuthStore } from "@/stores/useAuthStore";

function getStoredToken() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().token ?? getStoredToken();
  const headers = new Headers(init?.headers);

  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  const data = await response.json();

  if (response.status === 401) {
    useAuthStore.getState().logout();

    if (typeof window !== "undefined") {
      window.location.assign("/login?expired=true");
    }

    throw new Error(data.error ?? "Session expired");
  }

  if (!response.ok) {
    throw new Error(data.error ?? "Request failed");
  }

  return data as T;
}

export const apiClient = {
  get: <T>(input: string) => request<T>(input),
  post: <T>(input: string, body?: unknown) =>
    request<T>(input, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  put: <T>(input: string, body?: unknown) =>
    request<T>(input, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
};
