import nodemailer from "nodemailer";
import { config } from "../lib/config";
import { logger } from "../lib/logger";
import type { SharePermission } from "../shared/canvas";

const SMTP_TLS_PORT = 465;
const SMTP_CONNECTION_TIMEOUT_MS = 10_000;
const SMTP_GREETING_TIMEOUT_MS = 10_000;
const SMTP_SOCKET_TIMEOUT_MS = 30_000;
const SENDER_NAME = "Home Design Studio";
const EDITOR_PATH = "/editor";

type ShareInvite = {
  to: string;
  designName: string;
  inviterName: string;
  permission: SharePermission;
  designId: string;
};

const transporter = config.smtp
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === SMTP_TLS_PORT,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
      connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
      greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
      socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
    })
  : null;

export const sendShareInviteEmail = async (invite: ShareInvite) => {
  if (!transporter || !config.smtp) {
    logger.warn("SMTP not configured, skipping email send", { designId: invite.designId });
    return;
  }

  try {
    await transporter.sendMail({
      from: `"${SENDER_NAME}" <${config.smtp.from}>`,
      to: invite.to,
      subject: `${invite.inviterName} shared "${invite.designName}" with you`.replace(
        /[\r\n]/g,
        " ",
      ),
      html: inviteHtml(invite),
    });
    logger.info("Share invite email sent", { designId: invite.designId });
  } catch (err) {
    logger.error("Failed to send share invite email", {
      code: err instanceof Error && "code" in err ? err.code : undefined,
      designId: invite.designId,
    });
  }
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const inviteHtml = (invite: ShareInvite): string => {
  const permissionLabel = invite.permission === "readwrite" ? "edit" : "view";
  const link = `${config.frontendUrl}${EDITOR_PATH}/${invite.designId}`;
  const safeInviter = escapeHtml(invite.inviterName);
  const safeDesignName = escapeHtml(invite.designName);

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; background: #0C0C0C; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #D4A853, #B8922E); padding: 28px 32px;">
        <h1 style="margin: 0; font-size: 20px; color: #0C0C0C; font-weight: 700;">${SENDER_NAME}</h1>
      </div>
      <div style="padding: 32px;">
        <p style="color: #F5F0EB; font-size: 16px; margin: 0 0 16px;">
          <strong>${safeInviter}</strong> shared a design with you
        </p>
        <div style="background: #1A1510; border: 1px solid #2A2520; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
          <p style="color: #D4A853; font-size: 14px; margin: 0 0 4px; font-weight: 600;">${safeDesignName}</p>
          <p style="color: #8A8278; font-size: 13px; margin: 0;">Permission: <strong style="color: #C4B99A;">${permissionLabel}</strong></p>
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
};
