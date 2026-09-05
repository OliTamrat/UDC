import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

import { TEST_DB_PATH } from "./src/__tests__/test-db-path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    globalSetup: ["./src/__tests__/global-setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // Keep the suite off data/udc-water.db. See src/__tests__/test-db-path.ts.
    env: { DB_PATH: TEST_DB_PATH },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
