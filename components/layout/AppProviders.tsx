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
          duration: 4000,
          style: {
            maxWidth: "380px",
            width: "auto",
            fontSize: "14px",
            padding: "12px 16px",
            zIndex: 99999,
          },
          error: {
            style: {
              background: "#FEF2F2",
              color: "#DC2626",
              border: "1px solid #FECACA",
            },
          },
          success: {
            style: {
              background: "#F0FDF4",
              color: "#16A34A",
              border: "1px solid #BBF7D0",
            },
          },
        }}
      />
    </>
  );
}
