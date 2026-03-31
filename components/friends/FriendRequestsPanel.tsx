"use client";

import { useEffect, useEffectEvent, useState } from "react";
import toast from "react-hot-toast";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/client-api";
import { useChatStore } from "@/stores/useChatStore";

type RequestItem = {
  id: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    profilePic: string | null;
  };
};

export function FriendRequestsPanel() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const setPendingRequestCount = useChatStore((state) => state.setPendingRequestCount);

  const load = useEffectEvent(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{ success: true; requests: RequestItem[] }>(
        "/api/friends/requests",
      );
      setRequests(data.requests);
      setPendingRequestCount(data.requests.length);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load requests");
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    void load();
  }, []);

  async function respond(requestId: string, action: "accept" | "reject") {
    try {
      await apiClient.post("/api/friends/respond", { requestId, action });
      toast.success(`Request ${action}ed`);
      const next = requests.filter((item) => item.id !== requestId);
      setRequests(next);
      setPendingRequestCount(next.length);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update request");
    }
  }

  if (!loading && requests.length === 0) {
    return <EmptyState title="No pending requests" description="New friend requests will appear here." />;
  }

  return (
    <div className="space-y-3">
      {loading ? <p className="text-sm text-[var(--muted)]">Loading requests...</p> : null}
      {requests.map((request) => (
        <div key={request.id} className="rounded-xl border border-[var(--border)] bg-white p-3 sm:p-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              name={request.sender.displayName ?? request.sender.username}
              src={request.sender.profilePic}
              className="h-10 w-10 flex-shrink-0 sm:h-12 sm:w-12"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium sm:text-base">
                {request.sender.displayName ?? request.sender.username}
              </p>
              <p className="truncate text-xs text-[var(--muted)] sm:text-sm">
                @{request.sender.username}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button className="w-full justify-center sm:flex-1" onClick={() => respond(request.id, "accept")}>
              Accept
            </Button>
            <Button
              className="w-full justify-center sm:flex-1"
              variant="secondary"
              onClick={() => respond(request.id, "reject")}
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
