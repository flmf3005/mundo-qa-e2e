import { expect, test } from '../../src/fixtures';
import { DashboardPage } from '../../src/pages/dashboard.page';
import { LoginPage } from '../../src/pages/login.page';

// Estes testes CRIAM uma conta e uma organização "E2E ..." no ambiente (por isso a tag @writes).
test.describe('Cadastro e login', { tag: '@writes' }, () => {
  test('cadastro cria a conta e abre o painel já autenticado', async ({ loggedInPage }) => {
    const dashboard = new DashboardPage(loggedInPage);
    await dashboard.expectLoaded();
  });

  test('sair e entrar de novo com a mesma conta', async ({ loggedInPage, user }) => {
    const dashboard = new DashboardPage(loggedInPage);
    await dashboard.logout();

    const login = new LoginPage(loggedInPage);
    await login.loginAs(user.email, user.password);
    await dashboard.expectLoaded();
  });
});
