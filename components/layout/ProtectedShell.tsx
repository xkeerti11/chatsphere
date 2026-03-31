"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, LogOut, MessageCircle, Settings, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/useAuthStore";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/stories", label: "Stories", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

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

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/login");
    }
  }, [hydrated, router, user]);

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

      <nav className="pb-safe fixed bottom-0 left-0 right-0 z-50 flex border-t bg-white md:hidden">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 transition ${
                active ? "bg-[var(--brand-soft)] text-[var(--brand)]" : "text-[var(--muted)]"
              }`}
            >
              <Icon size={24} className="h-6 w-6 shrink-0" />
              <span className="text-[10px] sm:text-xs">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
