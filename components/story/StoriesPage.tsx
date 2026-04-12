"use client";

import { useEffect, useEffectEvent, useState } from "react";
import toast from "react-hot-toast";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { StoryBar } from "@/components/story/StoryBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/client-api";
import type { StoryFeedGroup } from "@/lib/types";
import { useAuthStore } from "@/stores/useAuthStore";

export function StoriesPage() {
  const hydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((state) => state.user);
  const [stories, setStories] = useState<StoryFeedGroup[]>([]);

  async function loadStories() {
    try {
      const data = await apiClient.get<{ success: true; stories: StoryFeedGroup[] }>("/api/stories/feed");
      setStories(data.stories);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load stories");
    }
  }

  const loadStoriesOnMount = useEffectEvent(async () => {
    await loadStories();
  });

  useEffect(() => {
    if (!hydrated || !user) return;
    void loadStoriesOnMount();
  }, [hydrated, user]);

  return (
    <ProtectedShell title="Stories">
      <div className="space-y-6">
        <div className="rounded-[1.75rem] bg-white p-5">
          {user ? <StoryBar user={user} groups={stories} onUploaded={loadStories} /> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stories.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState title="No active stories" description="Upload a story or wait for friends to share one." />
            </div>
          ) : (
            stories.map((group) => (
              <div key={group.user.id} className="rounded-[1.75rem] bg-white p-5">
                <p className="font-semibold">{group.user.displayName ?? group.user.username}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {group.stories.length} active stor{group.stories.length > 1 ? "ies" : "y"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </ProtectedShell>
  );
}
