import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end smoke suite. Both servers must be running:
 *   Rails API  → http://127.0.0.1:3001   (bin/rails server -p 3001)
 *   Angular    → http://127.0.0.1:4200   (npm start)
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://127.0.0.1:4200',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
