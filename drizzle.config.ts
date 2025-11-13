import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing — please set it in your .env file.");
}

export default defineConfig({
  schema: "./shared/schema.ts",  // adjust path if needed
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});
