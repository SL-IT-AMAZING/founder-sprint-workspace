// prisma.config.ts - REQUIRED for Prisma 7
// Place this file in project root (next to package.json)
// This replaces url/directUrl from schema.prisma

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
