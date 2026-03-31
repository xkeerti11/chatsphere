import { formatDistanceToNow } from "date-fns";
import type { UploadPurpose } from "@/lib/constants";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function buildUploadFolder(purpose: UploadPurpose) {
  const base = "chatsphere";
  if (purpose === "chat_attachment") return `${base}/messages`;
  if (purpose === "story_media") return `${base}/stories`;
  return `${base}/profiles`;
}

export function inferFileType(mimeType: string) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

export function formatRelativeTime(value: string | Date | null | undefined) {
  if (!value) return "just now";
  return formatDistanceToNow(new Date(value), { addSuffix: true });
}
