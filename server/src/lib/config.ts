import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  FIREBASE_PROJECT_ID: z.string().default(""),
  FIREBASE_CLIENT_EMAIL: z.string().default(""),
  FIREBASE_PRIVATE_KEY: z.string().default(""),

  OPENAI_API_KEY: z.string().default(""),

  STRIPE_SECRET_KEY: z.string().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
  STRIPE_PRO_PRICE_ID: z.string().default(""),

  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  SMTP_FROM: z.string().default(""),

  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  FRONTEND_URL: z.string().default(""),

  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
  console.error(`Invalid environment configuration:\n${problems}\n`);
  process.exit(1);
}

const env = parsed.data;

const config = {
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  firebaseProjectId: env.FIREBASE_PROJECT_ID,
  firebaseClientEmail: env.FIREBASE_CLIENT_EMAIL,
  firebasePrivateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  openaiApiKey: env.OPENAI_API_KEY,
  stripeSecretKey: env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
  stripeProPriceId: env.STRIPE_PRO_PRICE_ID,
  smtpHost: env.SMTP_HOST,
  smtpPort: env.SMTP_PORT,
  smtpUser: env.SMTP_USER,
  smtpPass: env.SMTP_PASS,
  smtpFrom: env.SMTP_FROM || env.SMTP_USER || "noreply@designstudio.app",
  corsOrigin: env.CORS_ORIGIN,
  frontendUrl: env.FRONTEND_URL || env.CORS_ORIGIN,
  nodeEnv: env.NODE_ENV,
  logLevel: env.LOG_LEVEL,
};

export const disabledFeatures = (): string[] => {
  const off: string[] = [];
  if (!config.firebaseProjectId || !config.firebasePrivateKey) off.push("authentication");
  if (!config.openaiApiKey) off.push("AI assistant");
  if (!config.stripeSecretKey) off.push("billing");
  if (!config.smtpUser || !config.smtpPass) off.push("share invite emails");
  return off;
};

export { config };
