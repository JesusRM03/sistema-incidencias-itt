import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  use: {
    baseURL: "http://localhost:3001",
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
