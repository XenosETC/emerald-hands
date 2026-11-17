const { defineConfig } = require('@playwright/test');

const port = Number(process.env.ARCADE_BROWSER_TEST_PORT || 4187);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('ARCADE_BROWSER_TEST_PORT must be a port from 1024 to 65535.');
}
const baseURL = `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: './scripts/browser',
  testMatch: '**/*.spec.cjs',
  outputDir: 'test-results',
  reporter: 'list',
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  use: {
    browserName: 'chromium',
    baseURL,
    channel: process.env.ARCADE_BROWSER_TEST_CHANNEL || undefined,
    navigationTimeout: 30000,
  },
  webServer: {
    command: 'node scripts/dev-server.mjs',
    env: { HOST: '127.0.0.1', PORT: String(port) },
    url: baseURL,
    reuseExistingServer: false,
  },
});
