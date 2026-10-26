import { defineConfig, devices } from '@playwright/test'

const BUYER_STATE = 'e2e/.auth/buyer.json'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],

  use: {
    baseURL: 'http://localhost:5199',
    trace: 'on-first-retry'
  },

  projects: [
    {
      name: 'setup',
      testMatch: /setup\.global\.ts$/,
      use: { ...devices['Pixel 5'], browserName: 'chromium' }
    },
    {
      name: 'mobile-chrome',
      testIgnore: /order\.spec\.ts/,
      use: { ...devices['Pixel 5'], browserName: 'chromium' }
    },
    {
      name: 'buyer-chrome',
      testMatch: /order\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Pixel 5'],
        browserName: 'chromium',
        storageState: BUYER_STATE
      }
    }
  ],

  webServer: [
    {
      // e2e 专用库：每次运行前删除，保证种子状态可复现（P001 stock=1 不被历次 run 耗尽）
      command: `node -e "const fs=require('fs');for (const f of ['data/e2e.db','data/e2e.db-wal','data/e2e.db-shm']) fs.rmSync(f,{force:true})" && npx tsx src/index.ts`,
      cwd: 'server',
      url: 'http://localhost:3001/api/products',
      env: { ...process.env, DB_PATH: 'data/e2e.db', PORT: '3001' },
      reuseExistingServer: !process.env.CI,
      timeout: 60000
    },
    {
      command: 'npm run dev -- --port 5199 --strictPort',
      url: 'http://localhost:5199',
      reuseExistingServer: !process.env.CI,
      timeout: 60000
    }
  ]
})
