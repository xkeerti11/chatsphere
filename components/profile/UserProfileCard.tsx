"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Avatar } from "@/components/ui/Avatar";
import { apiClient } from "@/lib/client-api";
import { useAuthStore } from "@/stores/useAuthStore";

type ProfileUser = {
  id: string;
  username: string;
  displayName: string | null;
  profilePic: string | null;
  bio: string | null;
};

type BlockStatusResponse = {
  success: true;
  isBlocked: boolean;
};

type BlockActionResponse = {
  success: true;
  isBlocked: boolean;
};

export function UserProfileCard({
  profileUser,
  isBlockedByThem = false,
}: {
  profileUser: ProfileUser;
  isBlockedByThem?: boolean;
}) {
  const currentUser = useAuthStore((state) => state.user);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.id === profileUser.id) {
      setIsBlocked(false);
      return;
    }

    let active = true;

    async function loadBlockState() {
      try {
        const data = await apiClient.get<BlockStatusResponse>(
          `/api/users/block?userId=${encodeURIComponent(profileUser.id)}`,
        );

        if (active) {
          setIsBlocked(data.isBlocked);
        }
      } catch (error) {
        if (active) {
          toast.error(error instanceof Error ? error.message : "Unable to load block status");
        }
      }
    }

    void loadBlockState();

    return () => {
      active = false;
    };
  }, [currentUser, profileUser.id]);

  async function handleBlock() {
    if (!currentUser || currentUser.id === profileUser.id) {
      return;
    }

    setLoading(true);
    try {
      const data = await apiClient.post<BlockActionResponse>("/api/users/block", {
        userId: profileUser.id,
        action: isBlocked ? "unblock" : "block",
      });

      setIsBlocked(data.isBlocked);
      toast.success(data.isBlocked ? "User blocked" : "User unblocked");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update block status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[1.5rem] bg-white p-4 sm:p-6">
      {isBlockedByThem ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500">You are blocked by this user</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar
              name={profileUser.displayName ?? profileUser.username}
              src={profileUser.profilePic}
              size="xl"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold">
                {profileUser.displayName ?? profileUser.username}
              </p>
              <p className="truncate text-sm text-gray-500">@{profileUser.username}</p>
            </div>
          </div>

          {profileUser.bio ? <p className="text-sm text-gray-600">{profileUser.bio}</p> : null}

          {currentUser && currentUser.id !== profileUser.id ? (
            <button
              type="button"
              onClick={() => void handleBlock()}
              disabled={loading}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                isBlocked
                  ? "bg-gray-100 text-gray-600"
                  : "bg-red-50 text-red-600 hover:bg-red-100"
              }`}
            >
              {isBlocked ? "Unblock" : "Block"}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
