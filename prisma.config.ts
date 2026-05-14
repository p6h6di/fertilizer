import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load .env.local so Prisma CLI picks up Next.js environment variables
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // Use DIRECT_URL for migrations/schema push (bypasses Neon's connection pooler)
    url: env("DIRECT_URL"),
  },
});
