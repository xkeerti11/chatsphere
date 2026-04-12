"use client";

import { create } from "zustand";
import type { SafeUser } from "@/lib/types";

type AuthState = {
  hydrated: boolean;
  user: SafeUser | null;
  token: string | null;
  hydrate: () => void;
  setAuth: (user: SafeUser, token: string) => void;
  updateUser: (user: SafeUser) => void;
  logout: () => void;
};

export const STORAGE_KEY = "chatsphere-auth";

export const useAuthStore = create<AuthState>((set) => ({
  hydrated: false,
  user: null,
  token: null,
  hydrate: () => {
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      set({ hydrated: true });
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { user: SafeUser; token: string };
      window.localStorage.setItem("token", parsed.token);
      window.localStorage.setItem("user", JSON.stringify(parsed.user));
      set({ hydrated: true, user: parsed.user, token: parsed.token });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
      set({ hydrated: true, user: null, token: null });
    }
  },
  setAuth: (user, token) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
      window.localStorage.setItem("token", token);
      window.localStorage.setItem("user", JSON.stringify(user));
    }
    set({ hydrated: true, user, token });
  },
  updateUser: (user) => {
    if (typeof window !== "undefined") {
      const token = useAuthStore.getState().token;
      if (token) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
        window.localStorage.setItem("user", JSON.stringify(user));
      }
    }
    set({ user });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
    }
    set({ hydrated: true, user: null, token: null });
  },
}));
