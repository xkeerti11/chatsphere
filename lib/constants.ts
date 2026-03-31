export const APP_NAME = "ChatSphere";
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const VERIFY_TOKEN_EXPIRY_HOURS = 24;
export const RESET_OTP_EXPIRY_MINUTES = 10;
export const RESET_OTP_MAX_ATTEMPTS = 5;

export const CHAT_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const STORY_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const PROFILE_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export const UPLOAD_PURPOSES = [
  "chat_attachment",
  "story_media",
  "profile_image",
] as const;

export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];
