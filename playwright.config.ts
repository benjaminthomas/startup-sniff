import { defineConfig, devices } from '@playwright/test'

const DEFAULT_PORT = Number(process.env.E2E_PORT ?? process.env.PLAYWRIGHT_PORT ?? 4123)
const HOST = process.env.E2E_HOST ?? '127.0.0.1'
const baseURL = process.env.E2E_BASE_URL ?? `http://${HOST}:${DEFAULT_PORT}`
const webServerCommand =
  process.env.E2E_WEB_COMMAND ??
  `npm run dev -- --hostname ${HOST} --port ${DEFAULT_PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /.*\.spec\.(ts|tsx)/,
  fullyParallel: true,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: process.env.CI
    ? [
        ['github'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
      ]
    : [
        ['list'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
      ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  webServer: {
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
