export const ERROR_CODES = {
  UNAUTHORIZED: "Unauthorized",
  AUTH_NOT_CONFIGURED: "Authentication is not configured",
  AUTH_UNAVAILABLE: "Service temporarily unavailable",
  PRO_REQUIRED: "Pro plan required",
  SHARE_PRO_REQUIRED: "Pro plan required to share designs",
  DESIGN_LIMIT_REACHED: "Design limit reached",
  DESIGN_NOT_FOUND: "Design not found",
  DESIGN_NOT_OWNED: "Design not found or not owned by you",
  COPY_SOURCE_NOT_FOUND: "Design to copy not found",
  TEMPLATE_NOT_FOUND: "Template not found",
  VERSION_NOT_FOUND: "Version not found",
  DESIGN_OR_VERSION_NOT_FOUND: "Design or version not found",
  USER_NOT_FOUND: "User not found",
  NOT_FOUND: "Not found",
  SHARE_SELF: "Cannot share with yourself",
  AI_NOT_CONFIGURED: "Design AI is not configured on this server",
  BILLING_NOT_CONFIGURED: "Billing is not configured",
  WEBHOOK_SIGNATURE_MISSING: "Missing stripe-signature header",
  WEBHOOK_SIGNATURE_INVALID: "Webhook error",
  VALIDATION_FAILED: "Invalid request",
  MALFORMED_BODY: "Malformed JSON body",
  BODY_TOO_LARGE: "Request body too large",
  UPLOAD_REJECTED: "Upload rejected",
  RATE_LIMITED: "Too many requests",
  INTERNAL: "Internal server error",
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

type HttpError = Error & {
  status: number;
  code: ErrorCode;
  details: Record<string, unknown>;
};

export const httpError = (
  status: number,
  code: ErrorCode,
  details: Record<string, unknown> = {},
): HttpError => Object.assign(new Error(ERROR_CODES[code]), { status, code, details });

export const isHttpError = (error: unknown): error is HttpError =>
  error instanceof Error &&
  "code" in error &&
  typeof error.code === "string" &&
  error.code in ERROR_CODES &&
  "status" in error;

export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
