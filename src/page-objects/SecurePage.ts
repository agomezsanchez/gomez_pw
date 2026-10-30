import type { Page, Locator } from '@playwright/test';

export class SecurePage {
  readonly heading: Locator;
  readonly logoutButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Secure Area', exact: true });
    this.logoutButton = page.getByRole('link', { name: 'Logout' });
  }

  async goto() {
    await this.page.goto('/secure');
  }

  async logout() {
    await this.logoutButton.click();
  }
}
