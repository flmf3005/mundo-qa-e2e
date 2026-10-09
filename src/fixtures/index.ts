import { test as base, expect, type Page } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page';
import { ProjectsPage, type ProjectData } from '../pages/projects.page';
import { RegisterPage } from '../pages/register.page';
import { newTestUser, type TestUser } from '../utils/data';

export interface Workspace {
  page: Page;
  user: TestUser;
  project: ProjectData;
  /** Chave do primeiro caso de teste criado no projeto (ex.: QAE-TC-1). */
  firstCaseKey: string;
}

interface Fixtures {
  /** Dados de um usuário novo (ainda não cadastrado). */
  user: TestUser;
  /** Página já autenticada: cria uma conta nova pelo cadastro e chega ao painel. */
  loggedInPage: Page;
  /** Conta nova + projeto criado e selecionado. Cada teste tem a própria organização, então não há colisão. */
  workspace: Workspace;
}

// Chave só com letras: o formato exato aceito pelo sistema não é público, e "QAE" é válido.
const PROJECT_KEY = 'QAE';

export const test = base.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  user: async ({}, use) => {
    await use(newTestUser());
  },
  // O cadastro pode esperar o limite de requisições da API liberar; esse tempo não conta no timeout do teste.
  loggedInPage: [
    async ({ page, user }, use) => {
      await new RegisterPage(page).registerAs(user);
      await new DashboardPage(page).expectLoaded();
      await use(page);
    },
    { timeout: 240_000 },
  ],
  workspace: async ({ loggedInPage, user }, use) => {
    const project: ProjectData = { key: PROJECT_KEY, name: 'Projeto E2E' };
    await new ProjectsPage(loggedInPage).create(project);
    await use({ page: loggedInPage, user, project, firstCaseKey: `${PROJECT_KEY}-TC-1` });
  },
});

export { expect };
