import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // DIRECT_URL is used by CLI (migrations, db push, introspection)
    // Use the non-pooler connection string from Neon dashboard
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
