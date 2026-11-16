import { z } from "zod";

const DEFAULT_PORT = 4000;
const DEFAULT_SMTP_HOST = "smtp.gmail.com";
const DEFAULT_SMTP_PORT = 587;
const DEFAULT_CORS_ORIGIN = "http://localhost:3000";
const EMULATOR_PROJECT_PREFIX = "demo-";

const optional = z
  .string()
  .transform((value) => (value === "" ? undefined : value))
  .optional();

const envSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

    FIREBASE_PROJECT_ID: optional,
    FIREBASE_CLIENT_EMAIL: optional,
    FIREBASE_PRIVATE_KEY: optional,
    FIREBASE_AUTH_EMULATOR_HOST: optional,

    OPENAI_API_KEY: optional,

    STRIPE_SECRET_KEY: optional,
    STRIPE_WEBHOOK_SECRET: optional,
    STRIPE_PRO_PRICE_ID: optional,

    SMTP_HOST: z.string().default(DEFAULT_SMTP_HOST),
    SMTP_PORT: z.coerce.number().int().positive().default(DEFAULT_SMTP_PORT),
    SMTP_USER: optional,
    SMTP_PASS: optional,
    SMTP_FROM: optional,

    CORS_ORIGIN: z.string().default(DEFAULT_CORS_ORIGIN),
    FRONTEND_URL: optional,

    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  })
  .refine(
    (env) =>
      !env.FIREBASE_AUTH_EMULATOR_HOST ||
      env.FIREBASE_PROJECT_ID?.startsWith(EMULATOR_PROJECT_PREFIX),
    {
      path: ["FIREBASE_AUTH_EMULATOR_HOST"],
      message: `the Auth emulator skips token verification, so FIREBASE_PROJECT_ID must be an emulator project starting with "${EMULATOR_PROJECT_PREFIX}"`,
    },
  );

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
  console.error(`Invalid environment configuration:\n${problems}\n`);
  process.exit(1);
}

const env = parsed.data;

const firebase =
  env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY
    ? {
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }
    : null;

const stripe =
  env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET && env.STRIPE_PRO_PRICE_ID
    ? {
        secretKey: env.STRIPE_SECRET_KEY,
        webhookSecret: env.STRIPE_WEBHOOK_SECRET,
        proPriceId: env.STRIPE_PRO_PRICE_ID,
      }
    : null;

const smtp =
  env.SMTP_USER && env.SMTP_PASS
    ? {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
        from: env.SMTP_FROM ?? env.SMTP_USER,
      }
    : null;

export const config = {
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  openaiApiKey: env.OPENAI_API_KEY,
  firebase,
  stripe,
  smtp,
  corsOrigin: env.CORS_ORIGIN,
  frontendUrl: env.FRONTEND_URL ?? env.CORS_ORIGIN,
  nodeEnv: env.NODE_ENV,
  logLevel: env.LOG_LEVEL,
};

export const disabledFeatures = (): string[] => {
  const off: string[] = [];
  if (!config.firebase) off.push("authentication");
  if (!config.openaiApiKey) off.push("Design AI");
  if (!config.stripe) off.push("billing");
  if (!config.smtp) off.push("share invite emails");
  return off;
};
