import { prisma } from "../db";
import { logger } from "../logger";
import { readdirSync } from "fs";
import { join } from "path";

const MIGRATIONS_DIR = join(import.meta.dir, "migrations");

const ensureMigrationsTable = async () => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "_migrations" (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

const getAppliedMigrations = async (): Promise<Set<string>> => {
  const rows = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM "_migrations" ORDER BY id`,
  );
  return new Set(rows.map((r) => r.name));
};

const recordMigration = async (name: string) => {
  await prisma.$executeRawUnsafe(`INSERT INTO "_migrations" (name) VALUES ($1)`, name);
};

const run = async () => {
  logger.info("Starting migration runner...");

  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".ts") || f.endsWith(".js"))
    .sort();

  let count = 0;

  for (const file of files) {
    const name = file.replace(/\.(ts|js)$/, "");

    if (applied.has(name)) {
      logger.info(`Skipping already applied: ${name}`);
      continue;
    }

    logger.info(`Applying migration: ${name}`);

    const migration = await import(join(MIGRATIONS_DIR, file));

    if (typeof migration.up !== "function") {
      logger.error(`Migration ${name} has no 'up' export`);
      process.exit(1);
    }

    await migration.up(prisma);
    await recordMigration(name);

    logger.info(`Applied: ${name}`);
    count++;
  }

  if (count === 0) {
    logger.info("No new migrations to apply");
  } else {
    logger.info(`Applied ${count} migration(s)`);
  }

  await prisma.$disconnect();
};

run().catch((err) => {
  logger.error("Migration failed", { error: err });
  process.exit(1);
});
