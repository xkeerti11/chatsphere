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
    subject: `Verify your ${APP_NAME} account`,
    text: `Hi ${username},

Please verify your email address for ${APP_NAME}.

Verify your account: ${verificationUrl}

This link expires in 24 hours. If you did not create this account, you can ignore this email.`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width">
        <title>Verify your email</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:500px;width:100%;">
                <tr>
                  <td style="background:#6C63FF;padding:32px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">
                      ${APP_NAME}
                    </h1>
                    <p style="color:#ffffff;opacity:0.8;margin:8px 0 0;font-size:14px;">
                      Connect. Chat. Share.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 32px;">
                    <h2 style="color:#111827;margin:0 0 16px;font-size:20px;">
                      Verify your email address
                    </h2>
                    <p style="color:#6B7280;margin:0 0 16px;font-size:15px;line-height:1.6;">
                      Hi ${username},
                    </p>
                    <p style="color:#6B7280;margin:0 0 24px;font-size:15px;line-height:1.6;">
                      Thanks for signing up! Click the button below to verify your email address and activate your account.
                    </p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" style="padding:8px 0 32px;">
                          <a href="${verificationUrl}" style="background:#6C63FF;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
                            Verify Email Address
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="color:#9CA3AF;font-size:13px;margin:0 0 8px;">
                      Or copy this link:
                    </p>
                    <p style="color:#6C63FF;font-size:12px;word-break:break-all;margin:0 0 24px;">
                      ${verificationUrl}
                    </p>
                    <hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 24px;">
                    <p style="color:#9CA3AF;font-size:12px;margin:0;">
                      This link expires in 24 hours. If you didn't create an account, ignore this email.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#F9FAFB;padding:20px 32px;text-align:center;">
                    <p style="color:#9CA3AF;font-size:12px;margin:0;">
                      &copy; 2025 ${APP_NAME}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
}

export async function sendOTPEmail(email: string, otp: string) {
  await sendMail({
    to: email,
    subject: `Your ${APP_NAME} verification code`,
    text: `Your ${APP_NAME} verification code is ${otp}.

This code expires in 10 minutes. Do not share this code with anyone.`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <table width="100%" style="padding:40px 0;">
          <tr><td align="center">
            <table width="480" style="background:#fff;border-radius:16px;overflow:hidden;max-width:480px;">
              <tr>
                <td style="background:#6C63FF;padding:32px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:24px;">
                    ${APP_NAME}
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="padding:40px 32px;text-align:center;">
                  <h2 style="color:#111827;margin:0 0 8px;">
                    Your verification code
                  </h2>
                  <p style="color:#6B7280;margin:0 0 32px;font-size:15px;">
                    Enter this code to verify your email
                  </p>
                  <div style="background:#F3F4F6;border-radius:12px;padding:24px;margin:0 0 24px;">
                    <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#6C63FF;">
                      ${otp}
                    </span>
                  </div>
                  <p style="color:#9CA3AF;font-size:13px;margin:0;">
                    This code expires in <strong>10 minutes</strong>.
                    Do not share this code with anyone.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background:#F9FAFB;padding:20px;text-align:center;">
                  <p style="color:#9CA3AF;font-size:12px;margin:0;">
                    If you didn't create an account, ignore this email.
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
