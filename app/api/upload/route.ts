import { NextRequest } from "next/server";
import { CHAT_FILE_TYPES, MAX_FILE_SIZE_BYTES, PROFILE_FILE_TYPES, STORY_FILE_TYPES } from "@/lib/constants";
import { authenticateRequest, unauthorized } from "@/lib/auth";
import { fail, ok } from "@/lib/api";
import { uploadFile } from "@/lib/cloudinary";
import { uploadPurposeSchema } from "@/lib/validations";

export const runtime = "nodejs";

function detectUploadedFileType(mimeType: string) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  return "document";
}

function isMagicBytesValid(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8;
  if (type === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50;
  if (type === "image/gif") return bytes[0] === 0x47 && bytes[1] === 0x49;
  if (type === "image/webp") return bytes[8] === 0x57 && bytes[9] === 0x45;
  if (type === "application/pdf") return bytes[0] === 0x25 && bytes[1] === 0x50;
  if (type === "video/mp4") return bytes[4] === 0x66 && bytes[5] === 0x74;
  if (type === "video/webm" || type === "video/quicktime") return true;
  return true;
}

function allowedTypesForPurpose(purpose: string) {
  if (purpose === "chat_attachment") return [...CHAT_FILE_TYPES];
  if (purpose === "story_media") return [...STORY_FILE_TYPES];
  return [...PROFILE_FILE_TYPES];
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return unauthorized(auth.error, auth.status);

  const formData = await request.formData();
  const file = formData.get("file");
  const purposeValue = formData.get("purpose");
  const purposeParsed = uploadPurposeSchema.safeParse(purposeValue);

  if (!(file instanceof File)) return fail("File is required");
  if (!purposeParsed.success) return fail("Upload purpose is required");
  if (file.size > MAX_FILE_SIZE_BYTES) return fail("File size exceeds 5MB limit");

  const allowed = allowedTypesForPurpose(purposeParsed.data);
  if (!allowed.includes(file.type as never)) {
    return fail("File type not supported");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isMagicBytesValid(bytes, file.type)) {
    return fail("File content validation failed");
  }

  const uploaded = await uploadFile({
    buffer: Buffer.from(bytes),
    purpose: purposeParsed.data,
    mimeType: file.type,
    filename: file.name,
  });

  return ok({
    success: true,
    url: uploaded.url,
    fileType: detectUploadedFileType(file.type),
    size: file.size,
  });
}
