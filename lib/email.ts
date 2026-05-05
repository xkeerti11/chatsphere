import nodemailer from "nodemailer";
import { APP_NAME } from "@/lib/constants";

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

async function sendMail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const transporter = getTransporter();

  if (!transporter) {
    console.info(`[mail-preview] ${subject} -> ${to}`);
    console.info(text);
    console.info(html);
    return;
  }

  await transporter.verify();

  await transporter.sendMail({
    from: {
      name: APP_NAME,
      address: process.env.EMAIL_USER!,
    },
    to,
    subject,
    text,
    html,
  });
}

export async function sendOTPEmail(email: string, otp: string, username?: string) {
  await sendMail({
    to: email,
    subject: `Your ${APP_NAME} verification code`,
    text: `Hi ${username || "there"},

Your verification code is: ${otp}. Valid for 10 minutes.

This code expires in 10 minutes. Do not share this code with anyone.`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width">
      </head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
          <tr><td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:480px;">
              <tr>
                <td style="background:#6C63FF;padding:28px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">
                    ${APP_NAME}
                  </h1>
                  <p style="color:#ffffff;opacity:0.85;margin:6px 0 0;font-size:13px;">
                    Connect. Chat. Share.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:36px 28px;text-align:center;">
                  <h2 style="color:#111827;margin:0 0 8px;font-size:20px;">
                    Verify your email
                  </h2>
                  <p style="color:#6B7280;margin:0 0 6px;font-size:14px;">
                    Hi ${username || "there"},
                  </p>
                  <p style="color:#6B7280;margin:0 0 28px;font-size:14px;line-height:1.5;">
                    Enter this code in the app to verify your email address:
                  </p>
                  <div style="background:#F3F4F6;border-radius:12px;padding:20px 24px;margin:0 0 24px;border:2px dashed #D1D5DB;">
                    <p style="margin:0 0 4px;font-size:12px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">
                      Your OTP Code
                    </p>
                    <span style="font-size:42px;font-weight:700;letter-spacing:10px;color:#6C63FF;display:block;margin-top:4px;">
                      ${otp}
                    </span>
                  </div>
                  <p style="color:#9CA3AF;font-size:12px;margin:0 0 8px;">
                    This code expires in <strong>10 minutes</strong>.
                  </p>
                  <p style="color:#9CA3AF;font-size:12px;margin:0;">
                    Never share this code with anyone.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background:#F9FAFB;padding:18px;text-align:center;border-top:1px solid #E5E7EB;">
                  <p style="color:#9CA3AF;font-size:11px;margin:0;">
                    If you didn't create a ${APP_NAME} account, please ignore this email.
                  </p>
                  <p style="color:#9CA3AF;font-size:11px;margin:6px 0 0;">
                    &copy; 2025 ${APP_NAME}. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}

export async function sendVerificationEmail(_options?: {
  email: string;
  username: string;
  verificationUrl: string;
}): Promise<void> {
  throw new Error("Link-based verification emails are disabled. Use sendOTPEmail instead.");
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
    text: `Use this one-time code to reset your password: ${otp}

This code expires in 10 minutes.`,
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

export async function sendResetOTPEmail(email: string, otp: string) {
  await sendMail({
    to: email,
    subject: "Reset your ChatSphere password",
    text: `Use this code to reset your password: ${otp}

Expires in 10 minutes. Never share this code.`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <table width="100%" style="padding:40px 0;">
          <tr><td align="center">
            <table width="480" style="background:#fff;border-radius:16px;overflow:hidden;max-width:480px;">
              <tr>
                <td style="background:#EF4444;padding:32px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:24px;">
                    ${APP_NAME}
                  </h1>
                  <p style="color:#fff;opacity:0.9;margin:8px 0 0;font-size:14px;">
                    Password Reset
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px 32px;text-align:center;">
                  <h2 style="color:#111827;margin:0 0 8px;">
                    Reset your password
                  </h2>
                  <p style="color:#6B7280;margin:0 0 32px;font-size:15px;">
                    Use this code to reset your password
                  </p>
                  <div style="background:#FEF2F2;border-radius:12px;padding:24px;margin:0 0 24px;border:2px solid #FECACA;">
                    <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#EF4444;">
                      ${otp}
                    </span>
                  </div>
                  <p style="color:#9CA3AF;font-size:13px;margin:0;">
                    Expires in <strong>10 minutes</strong>. Never share this code.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background:#F9FAFB;padding:20px;text-align:center;">
                  <p style="color:#9CA3AF;font-size:12px;margin:0;">
                    If you didn't request this, ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}
