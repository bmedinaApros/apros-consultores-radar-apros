import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgres://radar_app:radar_app_dev@localhost:5432/radar_test",
      MIGRATE_DATABASE_URL: process.env.TEST_MIGRATE_DATABASE_URL ?? "postgres://radar_owner:radar_dev@localhost:5432/radar_test",
      AUTH_ALLOWED_DOMAINS: "apros.pe",
      APP_URL: "http://localhost:3000",
      SESSION_SECRET: "test-secret-test-secret-test-secret-123456",
    },
  },
});
