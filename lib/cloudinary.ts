import { v2 as cloudinary, type UploadApiOptions } from "cloudinary";
import { buildUploadFolder } from "@/lib/utils";
import { getEnv } from "@/lib/env";
import type { UploadPurpose } from "@/lib/constants";

cloudinary.config({
  cloud_name: getEnv("CLOUDINARY_CLOUD_NAME", "demo"),
  api_key: getEnv("CLOUDINARY_API_KEY", "demo"),
  api_secret: getEnv("CLOUDINARY_API_SECRET", "demo"),
});

function isImageMimeType(mimeType: string) {
  return ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mimeType);
}

function isDocumentMimeType(mimeType: string) {
  return [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ].includes(mimeType);
}

export async function uploadFile(args: {
  buffer: Buffer;
  purpose: UploadPurpose;
  mimeType: string;
  filename: string;
}) {
  const uploadOptions: UploadApiOptions = {
    folder: buildUploadFolder(args.purpose),
    use_filename: false,
    unique_filename: true,
  };

  if (isImageMimeType(args.mimeType)) {
    uploadOptions.resource_type = "image";
  } else if (isDocumentMimeType(args.mimeType)) {
    uploadOptions.resource_type = "raw";
    uploadOptions.format = "";
  } else if (args.mimeType.startsWith("video/")) {
    uploadOptions.resource_type = "video";
  } else {
    uploadOptions.resource_type = "raw";
    uploadOptions.format = "";
  }

  return new Promise<{ url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Upload failed"));
          return;
        }

        resolve({
          url: result.secure_url,
        });
      },
    );

    stream.end(args.buffer);
  });
}
