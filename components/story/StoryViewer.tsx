"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { StoryDto, StoryFeedGroup } from "@/lib/types";

export type Story = StoryDto & {
  user: StoryFeedGroup["user"];
};

function clampIndex(index: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(Math.max(index, 0), total - 1);
}

export function StoryViewer({
  stories,
  initialIndex,
  onClose,
}: {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(() => clampIndex(initialIndex, stories.length));
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const goNextRef = useRef<() => void>(() => {});

  const currentStory = stories[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      setTimeout(() => onClose(), 0);
    }
  }, [currentIndex, onClose, stories.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  useEffect(() => {
    goNextRef.current = goNext;
  }, [goNext]);

  useEffect(() => {
    setCurrentIndex(clampIndex(initialIndex, stories.length));
    setProgress(0);
  }, [initialIndex, stories.length]);

  useEffect(() => {
    if (!currentStory) return;
    if (isPaused) return;

    const timer = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setTimeout(() => goNextRef.current(), 0);
          return 0;
        }

        return prev + 2;
      });
    }, 100);

    return () => window.clearInterval(timer);
  }, [currentIndex, isPaused]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    document.body.classList.add("story-viewer-open");
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.top = "0";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = "";
      document.body.style.top = "";
      document.body.classList.remove("story-viewer-open");
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentIndex, goNext, goPrev, onClose]);

  if (!currentStory) return null;

  const storyUserName = currentStory.user.displayName ?? currentStory.user.username;
  const isVideo = currentStory.mediaType.startsWith("video");

  return (
    <>
      <style jsx global>{`
        body.story-viewer-open nav.pb-safe {
          display: none !important;
        }
      `}</style>

      <div
        className="fixed inset-0 z-[9999] bg-black"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100dvh",
          minHeight: "-webkit-fill-available",
          zIndex: 9999,
        }}
        onPointerDown={() => setIsPaused(true)}
        onPointerUp={() => setIsPaused(false)}
        onPointerLeave={() => setIsPaused(false)}
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? 0;
          touchStartY.current = event.touches[0]?.clientY ?? 0;
        }}
        onTouchEnd={(event) => {
          const diffX = touchStartX.current - (event.changedTouches[0]?.clientX ?? 0);
          const diffY = Math.abs(touchStartY.current - (event.changedTouches[0]?.clientY ?? 0));

          if (diffY > 50) {
            onClose();
            return;
          }

          if (diffX > 50) goNext();
          if (diffX < -50) goPrev();
        }}
      >
        {isVideo ? (
          <video
            key={currentStory.id}
            src={currentStory.mediaUrl}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />
        ) : (
          <img
            key={currentStory.id}
            src={currentStory.mediaUrl}
            alt={currentStory.caption || `${storyUserName}'s story`}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            draggable={false}
          />
        )}

        <div
          className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-3 pt-3"
          style={{ paddingTop: "env(safe-area-inset-top, 12px)" }}
        >
          {stories.map((story, index) => {
            const width =
              index < currentIndex ? "100%" : index === currentIndex ? `${progress}%` : "0%";

            return (
              <div
                key={story.id}
                className="flex-1 h-0.5 bg-white/40 rounded-full overflow-hidden"
              >
                <div className="h-full bg-white" style={{ width }} />
              </div>
            );
          })}
        </div>

        <div
          className="absolute top-8 left-0 right-0 z-20 flex items-center justify-between px-4 py-2"
          style={{ marginTop: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="flex min-w-0 items-center">
            {currentStory.user.profilePic ? (
              <img
                src={currentStory.user.profilePic}
                alt={storyUserName}
                className="w-9 h-9 rounded-full object-cover border-2 border-white"
                draggable={false}
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-white/20 text-xs font-semibold text-white">
                {storyUserName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((value) => value[0]?.toUpperCase())
                  .join("") || "CS"}
              </div>
            )}
            <p className="truncate text-white font-semibold text-sm ml-2">{storyUserName}</p>
            <p className="truncate text-white/70 text-xs ml-1">
              {formatRelativeTime(currentStory.createdAt)}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close story viewer"
            onClick={onClose}
            className="ml-auto text-white bg-black/30 rounded-full w-8 h-8 flex items-center justify-center text-lg"
          >
            <X size={18} />
          </button>
        </div>

        <button
          type="button"
          aria-label="Previous story"
          className="absolute left-0 top-16 w-1/3 h-3/4 z-10 cursor-pointer"
          onClick={goPrev}
        />

        <button
          type="button"
          aria-label="Next story"
          className="absolute right-0 top-16 w-1/3 h-3/4 z-10 cursor-pointer"
          onClick={goNext}
        />

        {currentStory.caption ? (
          <div
            className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-6 bg-gradient-to-t from-black/60 to-transparent"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 24px)" }}
          >
            <p className="text-white text-sm text-center">{currentStory.caption}</p>
          </div>
        ) : null}
      </div>
    </>
  );
}
