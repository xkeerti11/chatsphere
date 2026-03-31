import nodemailer from "nodemailer";
import { APP_NAME } from "@/lib/constants";
import { getOptionalEnv } from "@/lib/env";

function getTransporter() {
  const user = getOptionalEnv("EMAIL_USER");
  const pass = getOptionalEnv("EMAIL_PASS");

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const transporter = getTransporter();

  if (!transporter) {
    console.info(`[mail-preview] ${subject} -> ${to}`);
    console.info(html);
    return;
  }

  await transporter.sendMail({
    from: `${APP_NAME} <${getOptionalEnv("EMAIL_USER")}>`,
    to,
    subject,
    html,
  });
}

export async function sendVerificationEmail({
  email,
  username,
  verificationUrl,
}: {
  email: string;
  username: string;
  verificationUrl: string;
}) {
  await sendMail({
    to: email,
    subject: `${APP_NAME} email verification`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2>Verify your ChatSphere account</h2>
        <p>Hi ${username},</p>
        <p>Click the button below to verify your email address.</p>
        <p style="margin:24px 0">
          <a href="${verificationUrl}" style="display:inline-block;padding:12px 22px;background:#6c63ff;color:#fff;border-radius:999px;text-decoration:none">Verify Email</a>
        </p>
        <p>If you did not create this account, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function sendResetOtpEmail({
  email,
  otp,
}: {
  email: string;
  otp: string;
}) {
  await sendMail({
    to: email,
    subject: `${APP_NAME} password reset code`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2>Password reset requested</h2>
        <p>Use this one-time code to reset your password:</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:10px;margin:16px 0;color:#6c63ff">${otp}</div>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  });
}
