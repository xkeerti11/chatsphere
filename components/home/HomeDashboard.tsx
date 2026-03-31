"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FriendRequestsPanel } from "@/components/friends/FriendRequestsPanel";
import { FriendSearch } from "@/components/friends/FriendSearch";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { StoryBar } from "@/components/story/StoryBar";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/client-api";
import type { FriendListItem, StoryFeedGroup } from "@/lib/types";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSocketStore } from "@/stores/useSocketStore";

export function HomeDashboard() {
  const hydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((state) => state.user);
  const isSocketConnected = useSocketStore((state) => state.isConnected);
  const onlineUserIds = useSocketStore((state) => state.onlineUserIds);
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [stories, setStories] = useState<StoryFeedGroup[]>([]);
  const loadedForUserRef = useRef<string | null>(null);

  async function fetchDashboardData() {
    return Promise.all([
      apiClient.get<{ success: true; friends: FriendListItem[] }>("/api/friends/list"),
      apiClient.get<{ success: true; stories: StoryFeedGroup[] }>("/api/stories/feed"),
    ]);
  }

  async function refreshDashboard() {
    try {
      const [friendsData, storyData] = await fetchDashboardData();
      setFriends(friendsData.friends);
      setStories(storyData.stories);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load dashboard");
    }
  }

  const loadData = useEffectEvent(async () => {
    await refreshDashboard();
  });

  useEffect(() => {
    if (!hydrated || !user) {
      loadedForUserRef.current = null;
      return;
    }

    if (loadedForUserRef.current === user.id) {
      return;
    }

    loadedForUserRef.current = user.id;
    void loadData();
  }, [hydrated, user]);

  useEffect(() => {
    if (!hydrated || !user || !isSocketConnected) return;
    void loadData();
  }, [hydrated, isSocketConnected, user]);

  return (
    <ProtectedShell title="Home">
      <div className="space-y-4 overflow-x-hidden sm:space-y-6">
        <section className="space-y-2 sm:space-y-3">
          <div>
            <p className="font-display text-base font-semibold sm:text-lg">Stories</p>
            <p className="text-sm text-[var(--muted)] sm:text-base">
              Share 24-hour moments with your friends.
            </p>
          </div>
          {user ? <StoryBar user={user} groups={stories} onUploaded={refreshDashboard} /> : null}
        </section>

        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
          <section className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-[1.5rem] bg-white p-3 sm:p-4">
                <p className="text-xs font-semibold text-[var(--muted)] sm:text-sm">Friends online</p>
                <p className="mt-2 font-display text-2xl font-bold sm:text-3xl lg:text-4xl">
                  {friends.filter((friend) => onlineUserIds.includes(friend.id)).length}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-white p-3 sm:p-4">
                <p className="text-xs font-semibold text-[var(--muted)] sm:text-sm">
                  Conversations ready
                </p>
                <p className="mt-2 font-display text-2xl font-bold sm:text-3xl lg:text-4xl">
                  {friends.length}
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-white p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-base font-semibold sm:text-lg">Friends</p>
                  <p className="text-sm text-[var(--muted)] sm:text-base">Jump straight into a chat.</p>
                </div>
                <Link
                  href="/chat"
                  className="inline-flex min-h-[44px] items-center py-2 text-sm font-semibold text-[var(--brand)]"
                >
                  Open chat
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {friends.length === 0 ? (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <EmptyState
                      title="No friends yet"
                      description="Search for users and send your first request."
                    />
                  </div>
                ) : (
                  friends.slice(0, 6).map((friend) => (
                    <Link
                      key={friend.id}
                      href={`/chat?friend=${friend.id}`}
                      className="flex min-h-[44px] items-center gap-3 rounded-xl border border-[var(--border)] bg-white p-3 transition hover:bg-gray-50 sm:p-4"
                    >
                      <Avatar
                        name={friend.displayName ?? friend.username}
                        src={friend.profilePic}
                        className="h-10 w-10 flex-shrink-0 sm:h-12 sm:w-12"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium sm:text-base">
                          {friend.displayName ?? friend.username}
                        </p>
                        <p className="truncate text-xs text-[var(--muted)] sm:text-sm">
                          {onlineUserIds.includes(friend.id) ? "Online now" : "Offline"}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4 sm:space-y-6">
            <div className="rounded-[1.5rem] bg-white p-3 sm:p-4">
              <p className="font-display text-base font-semibold sm:text-lg">Find people</p>
              <p className="mb-4 text-sm text-[var(--muted)] sm:text-base">
                Search usernames and expand your circle.
              </p>
              <FriendSearch />
            </div>
            <div className="rounded-[1.5rem] bg-white p-3 sm:p-4">
              <p className="font-display text-base font-semibold sm:text-lg">Pending requests</p>
              <p className="mb-4 text-sm text-[var(--muted)] sm:text-base">
                Respond to new connection requests.
              </p>
              <FriendRequestsPanel />
            </div>
          </section>
        </div>
      </div>
    </ProtectedShell>
  );
}
