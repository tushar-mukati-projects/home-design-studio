import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { config } from "./config";

const POOL_MAX_CONNECTIONS = 10;
const POOL_IDLE_TIMEOUT_MS = 60_000;
const POOL_CONNECTION_TIMEOUT_MS = 10_000;

const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: POOL_MAX_CONNECTIONS,
  idleTimeoutMillis: POOL_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: POOL_CONNECTION_TIMEOUT_MS,
});

export const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
