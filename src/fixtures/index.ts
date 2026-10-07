import { test as base, expect, type Page } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page';
import { RegisterPage } from '../pages/register.page';
import { newTestUser, type TestUser } from '../utils/data';

interface Fixtures {
  /** Dados de um usuário novo (ainda não cadastrado). */
  user: TestUser;
  /** Página já autenticada: cria uma conta nova pelo cadastro e chega ao painel. */
  loggedInPage: Page;
}

export const test = base.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  user: async ({}, use) => {
    await use(newTestUser());
  },
  loggedInPage: async ({ page, user }, use) => {
    await new RegisterPage(page).registerAs(user);
    await new DashboardPage(page).expectLoaded();
    await use(page);
  },
});

export { expect };
