import { expect, test } from '@playwright/test';
import { LoginPage } from '../../src/pages/login.page';
import { RegisterPage } from '../../src/pages/register.page';

test.describe('Telas públicas de autenticação', () => {
  test('a tela de login mostra o formulário completo', { tag: '@smoke' }, async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await expect(login.emailInput).toBeVisible();
    await expect(login.passwordInput).toBeVisible();
    await expect(login.submitButton).toBeEnabled();
    await expect(login.forgotLink).toBeVisible();
  });

  test('o link do login leva ao cadastro e o do cadastro volta ao login', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.registerLink.click();
    await expect(page).toHaveURL(/\/cadastro$/);

    const register = new RegisterPage(page);
    await expect(register.form).toBeVisible();
    await register.loginLink.click();
    await expect(page).toHaveURL(/\/entrar$/);
  });

  test('rota protegida sem sessão redireciona para o login', async ({ page }) => {
    await page.goto('/projetos');
    await expect(page).toHaveURL(/\/entrar/);
    await expect(new LoginPage(page).form).toBeVisible();
  });
});
