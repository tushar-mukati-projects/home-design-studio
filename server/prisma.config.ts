import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer reads .env automatically; the import above does it.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
