import nodemailer from "nodemailer";
import { logger } from "../logger";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const fromEmail = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@designstudio.app";
const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3000";

export const sendShareInviteEmail = async (
  toEmail: string,
  designName: string,
  inviterName: string,
  permission: string,
  designId: string,
) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn("SMTP not configured, skipping email send");
    return;
  }

  const permLabel = permission === "readwrite" ? "edit" : "view";
  const link = `${clientUrl}/editor/${designId}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; background: #0C0C0C; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #D4A853, #B8922E); padding: 28px 32px;">
        <h1 style="margin: 0; font-size: 20px; color: #0C0C0C; font-weight: 700;">DesignStudio</h1>
      </div>
      <div style="padding: 32px;">
        <p style="color: #F5F0EB; font-size: 16px; margin: 0 0 16px;">
          <strong>${inviterName}</strong> shared a design with you
        </p>
        <div style="background: #1A1510; border: 1px solid #2A2520; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
          <p style="color: #D4A853; font-size: 14px; margin: 0 0 4px; font-weight: 600;">${designName}</p>
          <p style="color: #8A8278; font-size: 13px; margin: 0;">Permission: <strong style="color: #C4B99A;">${permLabel}</strong></p>
        </div>
        <a href="${link}" style="display: inline-block; background: #D4A853; color: #0C0C0C; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 8px; text-decoration: none;">
          Open Design
        </a>
        <p style="color: #5A5550; font-size: 12px; margin: 24px 0 0;">
          If you don't have an account, you'll be asked to sign up first.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"DesignStudio" <${fromEmail}>`,
      to: toEmail,
      subject: `${inviterName} shared "${designName}" with you`,
      html,
    });
    logger.info(`Share invite email sent to ${toEmail}`);
  } catch (err) {
    logger.error("Failed to send share invite email", {
      error: err instanceof Error ? err.message : String(err),
      to: toEmail,
    });
  }
};
