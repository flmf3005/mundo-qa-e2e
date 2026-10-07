import { expect, test } from '../../src/fixtures';
import { LoginPage } from '../../src/pages/login.page';

test.describe('Login com credenciais inválidas', () => {
  test('e-mail inexistente mostra erro e permanece na tela de login', async ({ page, user }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAs(user.email, user.password);

    await expect(login.formError).toBeVisible();
    await expect(page).toHaveURL(/\/entrar/);
  });
});
