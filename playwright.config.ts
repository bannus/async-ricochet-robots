import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E tests
 * Tests the client UI with mocked API responses
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',
  
  // Maximum time one test can run
  timeout: 30 * 1000,
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: 'html',
  
  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:8080',
    
    // Collect trace on failure
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run local dev server before starting tests
  webServer: process.env.CI ? {
    // In CI: Serve static files from client/dist
    command: 'npx --yes http-server dist -p 8080 -c-1 --silent',
    cwd: './client',
    url: 'http://localhost:8080',
    reuseExistingServer: false,
  } : {
    // Local dev: Use live-server with watch mode
    command: 'npm run dev',
    cwd: './client',
    url: 'http://localhost:8080',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
