"use client";

import { Search, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiClient } from "@/lib/client-api";
import type { FriendStatusView } from "@/lib/types";

type SearchResult = {
  id: string;
  username: string;
  displayName: string | null;
  profilePic: string | null;
  friendStatus: FriendStatusView;
};

export function FriendSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setResults([]);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function runSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const data = await apiClient.get<{ success: true; users: SearchResult[] }>(
        `/api/users/search?username=${encodeURIComponent(value)}`,
      );
      setResults(data.users);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function sendRequest(receiverId: string) {
    try {
      await apiClient.post("/api/friends/send", { receiverId });
      toast.success("Friend request sent");
      setResults((items) =>
        items.map((item) =>
          item.id === receiverId ? { ...item, friendStatus: "pending_sent" } : item,
        ),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send request");
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div ref={searchRef} className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
        <Input
          className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 pl-10 text-sm text-gray-700 transition-all placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Search username"
          value={query}
          onChange={(event) => runSearch(event.target.value)}
        />
        {loading || results.length > 0 ? (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
            {loading ? <p className="px-4 py-3 text-sm text-[var(--muted)]">Searching...</p> : null}
            {results.map((user) => (
              <div
                key={user.id}
                className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50 last:border-b-0"
              >
                <Avatar
                  name={user.displayName ?? user.username}
                  src={user.profilePic}
                  className="h-9 w-9 flex-shrink-0 rounded-full bg-purple-100 object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">
                    {user.displayName ?? user.username}
                  </p>
                  <p className="truncate text-xs text-gray-500">@{user.username}</p>
                </div>
                <div className="shrink-0">
                  {user.friendStatus === "none" ? (
                    <Button
                      variant="secondary"
                      className="justify-center"
                      onClick={() => sendRequest(user.id)}
                    >
                      <UserPlus size={16} className="shrink-0" />
                      Add
                    </Button>
                  ) : (
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                      {user.friendStatus.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
