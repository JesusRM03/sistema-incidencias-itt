import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
const file = process.env.ITT_ENV_FILE || (existsSync(".env") ? ".env" : ".env.demo");
if (existsSync(file)) process.loadEnvFile(file);
if (process.env.DB_NAME !== "incidencias_itt_demo" || process.env.ALLOW_DEMO !== "true")
  throw new Error("Playwright requiere la configuración de demostración.");
export default defineConfig({
  testDir: "./tests/browser",
  use: {
    baseURL: process.env.APP_ORIGIN,
    headless: true,
    browserName: "chromium",
    launchOptions: {
      executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
    },
  },
  reporter: [
    ["list"],
    ["json", { outputFile: "artifacts/browser-results.json" }],
  ],
  workers: 1,
  timeout: 30000,
});
