"use client";

import { Plus } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import { StoryViewer } from "@/components/story/StoryViewer";
import { Avatar } from "@/components/ui/Avatar";
import { apiClient } from "@/lib/client-api";
import type { SafeUser, StoryFeedGroup } from "@/lib/types";

export function StoryBar({
  user,
  groups,
  onUploaded,
}: {
  user: SafeUser;
  groups: StoryFeedGroup[];
  onUploaded: () => Promise<void> | void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const handleCloseViewer = useCallback(() => {
    setViewerIndex(null);
  }, []);

  async function uploadStory(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("purpose", "story_media");
      const upload = await apiClient.post<{ success: true; url: string; fileType: string }>(
        "/api/upload",
        formData,
      );
      await apiClient.post("/api/stories/upload", {
        mediaUrl: upload.url,
        mediaType: upload.fileType,
        caption: "",
      });
      toast.success("Story uploaded");
      await onUploaded();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload story");
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setUploading(false);
    }
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto px-3 pb-2 scrollbar-hide sm:gap-4 sm:px-4">
        <button
          className="flex min-h-[44px] flex-shrink-0 cursor-pointer flex-col items-center gap-1"
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <div className="gradient-brand flex h-14 w-14 items-center justify-center rounded-full text-white sm:h-16 sm:w-16">
            <Plus size={20} />
          </div>
          <span className="w-14 truncate text-center text-xs sm:w-16">
            {uploading ? "Uploading..." : "Add Story"}
          </span>
        </button>
        {groups.map((group, index) => (
          <button
            key={group.user.id}
            className="flex min-h-[44px] flex-shrink-0 cursor-pointer flex-col items-center gap-1"
            onClick={() => setViewerIndex(index)}
            type="button"
          >
            <div className="h-14 w-14 flex-shrink-0 rounded-full border-2 border-purple-500 p-[2px] sm:h-16 sm:w-16">
              <Avatar
                name={group.user.displayName ?? group.user.username}
                src={group.user.profilePic}
                size="lg"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <span className="w-14 truncate text-center text-xs sm:w-16">
              {group.user.id === user.id ? "Your Story" : group.user.displayName ?? group.user.username}
            </span>
          </button>
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*,video/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void uploadStory(file);
          }
        }}
      />
      {viewerIndex !== null ? (
        <StoryViewer
          key={groups[viewerIndex]?.user.id ?? viewerIndex}
          stories={
            groups[viewerIndex]?.stories.map((story) => ({
              ...story,
              user: groups[viewerIndex].user,
            })) ?? []
          }
          initialIndex={0}
          onClose={handleCloseViewer}
        />
      ) : null}
    </>
  );
}
