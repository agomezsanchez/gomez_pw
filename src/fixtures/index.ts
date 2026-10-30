import { test as base, type Browser } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { baseURL } from '../config/env';
import { SecurePage } from '../page-objects/SecurePage';

type WorkerFixtures = {
  workerStorageState: string;
};

type TestOptions = {
  sessionStorageData: Record<string, string>;
};

type TestFixtures = {
  seedSessionStorage: void;
  securePage: SecurePage;
};

const MAX_AGE_MS = 30 * 60 * 1000;

async function isStateValid(browser: Browser, file: string): Promise<boolean> {
  if (!fs.existsSync(file)) return false;
  if (Date.now() - fs.statSync(file).mtimeMs > MAX_AGE_MS) return false;

  const context = await browser.newContext({ baseURL, storageState: file });
  try {
    const page = await context.newPage();
    await page.goto('/secure');
    return !page.url().includes('/login');
  } finally {
    await context.close();
  }
}


export const test = base.extend<TestFixtures & TestOptions, WorkerFixtures>({
  // One logged-in state file per parallel worker.
  workerStorageState: [
    async ({ browser }, use, workerInfo) => {
      const file = path.resolve(__dirname, `../../.auth/worker-${workerInfo.parallelIndex}.json`);

      if (!(await isStateValid(browser, file))) {
        // API SIGN IN
        if (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD) {
          throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set');
        }

        const context = await browser.newContext({ baseURL, ignoreHTTPSErrors: true  });

        const response = await context.request.post('/authenticate', {
          form: {
            username: process.env.TEST_USER_EMAIL ?? '',
            password: process.env.TEST_USER_PASSWORD ?? '',
          },
        });

        if (!response.url().includes('/secure')) {
          throw new Error(`Login failed, ended up at ${response.url()}`);
        }

        await context.storageState({ path: file });
        await context.close();


        // UI SIGN IN
        /*
        const context = await browser.newContext({ baseURL, storageState: undefined });
        const page = await context.newPage();

        // Replace this with "create/pick account N" for a real app.
        await page.goto('/login');
        await page.getByLabel('Username').fill(process.env.TEST_USER_EMAIL ?? '');
        await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD ?? '');
        await page.getByRole('button', { name: 'Login' }).click();
        await page.waitForURL(/secure/);

        await context.storageState({ path: file });
        await context.close();
        */
      }

      await use(file);
    },
    { scope: 'worker' },
  ],

  // Every test in this worker starts from that worker's saved state.
  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  // Option: set per describe block or per test with test.use(...)
  sessionStorageData: [{}, { option: true }],

  // sessionStorage isn't saved by storageState, so we inject it on every page load.
  seedSessionStorage: [
    async ({ context, sessionStorageData }, use) => {
      const hostname = new URL(baseURL).hostname;
      await context.addInitScript(
        ({ data, host }) => {
          if (window.location.hostname !== host) return;
          for (const [key, value] of Object.entries(data)) {
            window.sessionStorage.setItem(key, value);
          }
        },
        { data: sessionStorageData, host: hostname },
      );
      await use();
    },
    { auto: true },
  ],

  securePage: async ({ page }, use) => {
    await use(new SecurePage(page));
  },
});

export { expect } from '@playwright/test';
