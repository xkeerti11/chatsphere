"use client";

import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSocketStore } from "@/stores/useSocketStore";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((state) => state.hydrate);
  const hydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const connect = useSocketStore((state) => state.connect);
  const disconnect = useSocketStore((state) => state.disconnect);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated || !user || !token) {
      disconnect();
      return;
    }

    connect(user.id);

    return () => disconnect();
  }, [connect, disconnect, hydrated, token, user]);

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          className: "!rounded-2xl !border !border-[var(--border)] !bg-white !text-[var(--foreground)] !shadow-xl",
          success: { iconTheme: { primary: "#19b36a", secondary: "#ffffff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#ffffff" } },
        }}
      />
    </>
  );
}
