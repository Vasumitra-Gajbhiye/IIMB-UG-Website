import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: ".env" });
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Prisma CLI / migrations need the non-pooled URL (Prisma 7 has no directUrl field).
    // Runtime queries still use DATABASE_URL via src/lib/prisma.ts.
    url: env("DIRECT_URL"),
  },
});
