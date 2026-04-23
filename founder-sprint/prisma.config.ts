import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const datasourceUrl = process.env.DATABASE_URL
  ? env("DATABASE_URL")
  : undefined;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: datasourceUrl,
    directUrl: process.env.DIRECT_URL || undefined,
  } as { url?: string; directUrl?: string },
});
