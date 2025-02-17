import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: 'list', // Use a simple list reporter instead of the HTML reporter
});
