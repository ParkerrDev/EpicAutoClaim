import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 150000, // Increased global test timeout to 150 seconds
  expect: {
    timeout: 10000, // Increased expect timeout
  },
  reporter: 'html',
  use: {
    headless: false, // Keep headless false for debugging
    actionTimeout: 0,
    trace: 'on-first-retry',
    // viewport: { width: 1280, height: 720 },  // Standard viewport size
  },
});