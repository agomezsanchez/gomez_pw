import { test, expect } from '../src/fixtures';

test.describe('secure area', () => {
  test('shows the secure area to a logged-in user', { tag: '@smoke' }, async ({ securePage }) => {
    await test.step('open the page', async () => {
      await securePage.goto();
    });

    await test.step('see the heading', async () => {
      await expect(securePage.heading).toBeVisible();
    });
  });

  test('can log out', { tag: '@regression' }, async ({ page, securePage }) => {
    await securePage.goto();
    await securePage.logout();
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('with seeded sessionStorage', () => {
  test.use({ sessionStorageData: { theme: 'dark' } });

  test('sees the seeded value', { tag: '@regression' }, async ({ page, securePage }) => {
    await securePage.goto();

    const theme = await page.evaluate(() => window.sessionStorage.getItem('theme'));
    expect(theme).toBe('dark');
  });
});
