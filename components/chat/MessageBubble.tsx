"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CheckCheck } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { MessageDto } from "@/lib/types";

export function MessageBubble({
  message,
  currentUserId,
}: {
  message: MessageDto;
  currentUserId: string;
}) {
  const own = message.senderId === currentUserId;
  const imageUrl = message.fileType === "image" ? (message.fileUrl ?? undefined) : undefined;
  const documentUrl =
    message.fileType === "pdf" || message.fileType === "document"
      ? (message.fileUrl ?? undefined)
      : undefined;
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxImage(null);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = lightboxImage ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxImage]);

  return (
    <>
      <div className={cn("flex w-full px-3 py-1 sm:px-4", own ? "justify-end" : "justify-start")}>
        <div
          className={cn(
            "max-w-[78%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[65%] sm:px-4 sm:py-2.5 md:max-w-[55%]",
            own ? "bg-[var(--brand)] text-white" : "bg-white text-[var(--foreground)]",
          )}
        >
          {message.text ? <p className="break-words text-sm sm:text-base">{message.text}</p> : null}
          {imageUrl ? (
            <div
              className={cn(message.text ? "mt-3" : "")}
              onClick={() => setLightboxImage(imageUrl)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setLightboxImage(imageUrl);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <Image
                src={imageUrl}
                alt="Chat attachment"
                width={192}
                height={192}
                sizes="(max-width: 640px) 160px, 192px"
                className="h-40 w-40 rounded-xl object-cover cursor-pointer transition-opacity hover:opacity-90 sm:h-48 sm:w-48"
              />
            </div>
          ) : null}
          {documentUrl ? (
            <a
              href={documentUrl}
              target="_blank"
              download
              rel="noreferrer"
              className={cn(
                "inline-flex min-h-[44px] items-center rounded-xl border px-3 py-2 text-sm font-medium underline-offset-2 hover:underline sm:text-base",
                own
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-black/10 bg-black/5 text-[var(--foreground)]",
                message.text ? "mt-3" : "",
              )}
            >
              {message.fileType === "pdf" ? "Download PDF" : "Download Document"}
            </a>
          ) : null}
          <div
            className={cn(
              "mt-1 flex items-center gap-1 text-[10px] opacity-60 sm:text-xs",
              own ? "text-white" : "text-[var(--muted)]",
            )}
          >
            <span>{formatRelativeTime(message.createdAt)}</span>
            {own ? <CheckCheck size={12} className={message.isRead ? "text-cyan-200" : ""} /> : null}
          </div>
        </div>
      </div>

      {lightboxImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={lightboxImage}
              alt="Full size"
              width={1600}
              height={1600}
              sizes="90vw"
              className="max-h-[90vh] max-w-full rounded-xl object-contain"
            />
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute right-2 top-2 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/20 text-lg font-bold text-white transition-colors hover:bg-white/40"
            >
              X
            </button>
            <a
              href={lightboxImage}
              download
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="absolute bottom-2 right-2 inline-flex min-h-[44px] items-center rounded-full bg-white/20 px-4 py-2 text-sm text-white transition-colors hover:bg-white/40"
            >
              Download
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}
