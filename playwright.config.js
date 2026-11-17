import { defineConfig, devices } from '@playwright/test';

const executablePath = process.env.DRIEKLEUR_CHROMIUM;

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: 'test-results',
  reporter: 'list',
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:4175',
    trace: 'retain-on-failure',
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 834, height: 1112 }, hasTouch: true, isMobile: true } },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4175 --strictPort',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: !process.env.CI,
  },
});
