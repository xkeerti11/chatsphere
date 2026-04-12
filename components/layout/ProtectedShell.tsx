"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Home, LogOut, MessageCircle, Settings, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import type { AppNotification } from "@/lib/types";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSocketStore } from "@/stores/useSocketStore";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/stories", label: "Stories", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

function checkTokenExpiry() {
  if (typeof window === "undefined") return false;

  const token = window.localStorage.getItem("token");
  if (!token) return false;

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(window.atob(base64)) as { exp?: number };

    if (!payload.exp) {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
      return false;
    }

    const expiryTime = payload.exp * 1000;
    const now = Date.now();

    if (now > expiryTime) {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
      return false;
    }

    return true;
  } catch {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("user");
    return false;
  }
}

export function ProtectedShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const socket = useSocketStore((state) => state.socket);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const hasToken = typeof window !== "undefined" && Boolean(window.localStorage.getItem("token"));
    const isValid = checkTokenExpiry();

    if (hasToken && !isValid) {
      logout();
      router.push("/login?expired=true");
      return;
    }

    if (hydrated && !user) {
      router.replace("/login");
    }
  }, [hydrated, logout, router, user]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleNotification = (notification: AppNotification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 20));
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("new_notification", handleNotification);

    return () => {
      socket.off("new_notification", handleNotification);
    };
  }, [socket]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (
        notifRef.current &&
        !notifRef.current.contains(target) &&
        !target.closest("[data-notification-toggle='true']")
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!hydrated || !user) {
    return (
      <div className="flex h-screen items-center justify-center overflow-hidden bg-gray-50 p-4 sm:p-6">
        <div className="app-card w-full max-w-md rounded-[1.5rem] p-6 text-center sm:p-8">
          <p className="font-display text-lg font-semibold sm:text-xl">Loading ChatSphere</p>
          <p className="mt-2 text-sm text-[var(--muted)] sm:text-base">
            Preparing your conversations and stories.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="hidden h-full w-64 flex-shrink-0 flex-col overflow-y-auto border-r bg-white md:flex lg:w-72">
        <div className="gradient-brand rounded-[1.25rem] p-4 text-white lg:p-5">
          <p className="font-display text-xl font-bold lg:text-2xl">ChatSphere</p>
          <p className="mt-1 text-xs text-white/80 sm:text-sm">Connect. Chat. Share.</p>
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/12 p-3">
            <Avatar
              name={user.displayName ?? user.username}
              size="lg"
              src={user.profilePic}
              className="h-12 w-12 shrink-0 lg:h-14 lg:w-14"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold sm:text-base">
                {user.displayName ?? user.username}
              </p>
              <p className="truncate text-xs text-white/80 sm:text-sm">@{user.username}</p>
            </div>
          </div>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-2 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-h-[44px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition sm:text-base ${
                  active
                    ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "text-[var(--muted)] hover:bg-white hover:text-[var(--foreground)]"
                }`}
              >
                <Icon size={20} className="shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4">
          <Button
            variant="danger"
            className="min-h-[44px] w-full justify-center"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            <LogOut size={18} className="shrink-0" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden pb-16 md:pb-0">
          <main className="app-card flex h-full min-h-0 flex-col overflow-hidden rounded-none md:m-4 md:rounded-[1.5rem] lg:m-6">
            <header className="border-b border-[var(--border)] px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold sm:text-xl lg:text-2xl">{title}</p>
                  <p className="text-xs text-[var(--muted)] sm:text-sm">
                    Real-time conversations with your circle.
                  </p>
                </div>
                <div className="hidden items-center md:flex">
                  <button
                    data-notification-toggle="true"
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setUnreadCount(0);
                    }}
                    className="relative rounded-full p-2 transition-colors hover:bg-gray-100"
                  >
                    <Bell className="h-5 w-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                </div>
                <div className="flex items-center md:hidden">
                  <Avatar
                    name={user.displayName ?? user.username}
                    size="sm"
                    src={user.profilePic}
                    className="h-10 w-10 shrink-0"
                  />
                </div>
              </div>
            </header>
            <div className="flex-1 min-h-0 overflow-y-auto pb-16 md:pb-0">{children}</div>
          </main>
        </div>
      </div>

      {showNotifications && (
        <div
          ref={notifRef}
          className="fixed inset-x-4 bottom-20 z-50 max-h-96 overflow-y-auto rounded-2xl border bg-white shadow-xl md:inset-x-auto md:right-10 md:top-24 md:w-80 md:bottom-auto"
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={() => setNotifications([])}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Clear all
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">No notifications yet</div>
          ) : (
            notifications.map((notif, index) => (
              <div
                key={`${notif.timestamp}-${notif.fromUserId}-${index}`}
                onClick={() => {
                  setShowNotifications(false);
                  router.push("/chat");
                }}
                className="flex cursor-pointer items-start gap-3 border-b px-4 py-3 transition-colors hover:bg-gray-50 last:border-b-0"
              >
                <Avatar
                  name={notif.fromUsername || "Someone"}
                  src={notif.fromProfilePic}
                  size="sm"
                  className="h-9 w-9 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{notif.fromUsername}</p>
                  <p className="mt-0.5 truncate text-xs text-gray-500">{notif.text}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(notif.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500" />
              </div>
            ))
          )}
        </div>
      )}

      <nav className="pb-safe fixed bottom-0 left-0 right-0 z-50 flex border-t bg-white md:hidden">
        <Link
          href="/"
          aria-label="Home"
          className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 transition ${
            pathname === "/" ? "bg-[var(--brand-soft)] text-[var(--brand)]" : "text-[var(--muted)]"
          }`}
        >
          <Home size={24} className="h-6 w-6 shrink-0" />
          <span className="text-[10px] sm:text-xs">Home</span>
        </Link>
        <Link
          href="/chat"
          aria-label="Chat"
          className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 transition ${
            pathname === "/chat" ? "bg-[var(--brand-soft)] text-[var(--brand)]" : "text-[var(--muted)]"
          }`}
        >
          <MessageCircle size={24} className="h-6 w-6 shrink-0" />
          <span className="text-[10px] sm:text-xs">Chat</span>
        </Link>
        <button
          data-notification-toggle="true"
          type="button"
          onClick={() => {
            setShowNotifications(!showNotifications);
            setUnreadCount(0);
          }}
          className="relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 text-[var(--muted)] transition"
        >
          <Bell size={24} className="h-6 w-6 shrink-0" />
          {unreadCount > 0 && (
            <span className="absolute right-[calc(50%-22px)] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="text-[10px] sm:text-xs">Alerts</span>
        </button>
        <Link
          href="/stories"
          aria-label="Stories"
          className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 transition ${
            pathname === "/stories"
              ? "bg-[var(--brand-soft)] text-[var(--brand)]"
              : "text-[var(--muted)]"
          }`}
        >
          <Sparkles size={24} className="h-6 w-6 shrink-0" />
          <span className="text-[10px] sm:text-xs">Stories</span>
        </Link>
        <Link
          href="/settings"
          aria-label="Settings"
          className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 transition ${
            pathname === "/settings"
              ? "bg-[var(--brand-soft)] text-[var(--brand)]"
              : "text-[var(--muted)]"
          }`}
        >
          <Settings size={24} className="h-6 w-6 shrink-0" />
          <span className="text-[10px] sm:text-xs">Settings</span>
        </Link>
      </nav>
    </div>
  );
}
