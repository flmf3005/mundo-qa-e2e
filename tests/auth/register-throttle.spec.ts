import { expect, test } from '../../src/fixtures';
import { DashboardPage } from '../../src/pages/dashboard.page';
import { RegisterPage } from '../../src/pages/register.page';

// Cobre a própria proteção da suíte contra o limite de cadastros da API. A primeira resposta é simulada (429, com o
// mesmo texto que a API devolve); a segunda vai de verdade ao ambiente e cria uma conta, por isso a tag @writes.
test.describe('Cadastro sob limite de requisições', { tag: '@writes' }, () => {
  test('espera e repete sozinho quando a API responde 429', async ({ page, user }) => {
    test.setTimeout(120_000);

    let blocked = 0;
    await page.route('**/api/auth/register', async (route) => {
      if (blocked < 1) {
        blocked++;
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ statusCode: 429, message: 'ThrottlerException: Too Many Requests' }),
        });
        return;
      }
      await route.continue();
    });

    await new RegisterPage(page).registerAs(user);

    await new DashboardPage(page).expectLoaded();
    expect(blocked).toBe(1);
    expect(test.info().annotations.map((a) => a.type)).toContain('cadastro-limitado');
  });
});
