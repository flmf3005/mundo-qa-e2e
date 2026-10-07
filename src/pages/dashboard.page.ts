import { expect, type Locator, type Page } from '@playwright/test';

export class DashboardPage {
  readonly root: Locator;
  readonly title: Locator;
  readonly userButton: Locator;
  readonly logoutItem: Locator;
  readonly envBadge: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByTestId('dashboard-page');
    this.title = page.getByTestId('dashboard-title');
    this.userButton = page.getByTestId('topbar-user-button');
    this.logoutItem = page.getByTestId('topbar-user-logout');
    this.envBadge = page.getByTestId('env-badge');
  }

  async expectLoaded() {
    await expect(this.root).toBeVisible();
    await expect(this.title).toHaveText('Painel');
  }

  async logout() {
    await this.userButton.click();
    await this.logoutItem.click();
    await expect(this.page).toHaveURL(/\/entrar$/);
  }
}
