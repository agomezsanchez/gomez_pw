import { test as setup, expect } from '@playwright/test';
import path from 'node:path';

const authFile = path.join(__dirname, '../.auth/user.json');

// if need role-based states we can use this setup

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill(process.env.TEST_USER_EMAIL ?? '');
  await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD ?? '');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByText('You logged into a secure area!')).toBeVisible();

  await page.context().storageState({ path: authFile });
});
