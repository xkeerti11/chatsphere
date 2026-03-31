"use client";

import { Avatar } from "@/components/ui/Avatar";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { FriendListItem } from "@/lib/types";

export function ChatSidebar({
  friends,
  onlineUserIds,
  selectedFriendId,
  onSelect,
}: {
  friends: FriendListItem[];
  onlineUserIds: string[];
  selectedFriendId?: string | null;
  onSelect: (friend: FriendListItem) => void;
}) {
  return (
    <div className="space-y-2 sm:space-y-3">
      {friends.map((friend) => {
        const isOnline = onlineUserIds.includes(friend.id);

        return (
          <button
            key={friend.id}
            className={cn(
              "flex min-h-[44px] w-full items-center gap-3 rounded-xl p-3 text-left transition-colors",
              selectedFriendId === friend.id
                ? "bg-[var(--brand-soft)]"
                : "bg-white hover:bg-gray-50",
            )}
            onClick={() => onSelect(friend)}
          >
            <div className="relative flex-shrink-0">
              <Avatar
                name={friend.displayName ?? friend.username}
                src={friend.profilePic}
                size="md"
                className="h-10 w-10 sm:h-12 sm:w-12"
              />
              <span
                className={cn(
                  "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
                  isOnline ? "bg-emerald-500" : "bg-slate-300",
                )}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium sm:text-base">
                  {friend.displayName ?? friend.username}
                </p>
                <span className="shrink-0 text-[10px] text-[var(--muted)] sm:text-xs">
                  {formatRelativeTime(friend.lastSeen)}
                </span>
              </div>
              <p className="truncate text-xs text-gray-500">
                {isOnline ? "Online now" : "Tap to open chat"}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
