import { z } from "zod";
import { UPLOAD_PURPOSES } from "@/lib/constants";

export const PASSWORD_TOO_SHORT_MESSAGE = "ye password small hai";
export const LOGIN_PASSWORD_INCORRECT_MESSAGE = "ye sahi se daal";

export const registerSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  username: z
    .string()
    .trim()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8, PASSWORD_TOO_SHORT_MESSAGE),
});

export const loginSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(8, PASSWORD_TOO_SHORT_MESSAGE),
});

export const verifySchema = z.object({
  token: z.string().min(16),
});

export const resendVerificationSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
});

export const forgotPasswordSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
});

export const resetPasswordSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  otp: z.string().regex(/^\d{6}$/),
  newPassword: z.string().min(8, PASSWORD_TOO_SHORT_MESSAGE),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, PASSWORD_TOO_SHORT_MESSAGE),
  newPassword: z.string().min(8, PASSWORD_TOO_SHORT_MESSAGE),
});

export const profileUpdateSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  displayName: z.string().trim().max(50).optional().or(z.literal("")),
  bio: z.string().trim().max(160).optional().or(z.literal("")),
  profilePic: z.url().optional().or(z.literal("")),
});

export const friendSendSchema = z.object({
  receiverId: z.string().min(1),
});

export const friendRespondSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(["accept", "reject"]),
});

export const messageSendSchema = z
  .object({
    receiverId: z.string().min(1),
    text: z.string().trim().max(2000).optional().nullable(),
    fileUrl: z.string().trim().optional().nullable(),
    fileType: z.string().trim().optional().nullable(),
  })
  .refine((value) => Boolean(value.text?.trim() || value.fileUrl?.trim()), {
    message: "Message must include text or file",
  });

export const storyUploadSchema = z.object({
  mediaUrl: z.url(),
  mediaType: z.string().trim().min(3),
  caption: z.string().trim().max(160).optional().nullable(),
});

export const uploadPurposeSchema = z.enum(UPLOAD_PURPOSES);
