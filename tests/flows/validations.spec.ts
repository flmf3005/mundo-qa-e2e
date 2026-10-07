import { expect, test } from '../../src/fixtures';
import { DashboardPage } from '../../src/pages/dashboard.page';
import { ProjectsPage } from '../../src/pages/projects.page';
import { RegisterPage } from '../../src/pages/register.page';
import { UsersPage } from '../../src/pages/users.page';
import { newTestUser } from '../../src/utils/data';

test.describe('Validações de formulário', { tag: '@writes' }, () => {
  test('projeto: chave duplicada e chave em formato inválido são recusadas', async ({ workspace }) => {
    const { page, project } = workspace;
    const projects = new ProjectsPage(page);
    const keyError = page.getByTestId('projects-create-key-error');
    const formError = page.getByTestId('projects-create-form-error');

    await projects.goto();
    await projects.createButton.click();
    await projects.keyInput.fill(project.key);
    await projects.nameInput.fill('Outro projeto');
    await projects.submitButton.click();
    await expect(keyError.or(formError)).toBeVisible();
    await expect(page.getByTestId('projects-create-modal')).toBeVisible();

    await projects.keyInput.fill('1');
    await projects.submitButton.click();
    await expect(keyError).toBeVisible();
  });

  test('caso de teste sem título não é salvo', async ({ workspace }) => {
    const { page } = workspace;

    await page.goto('/casos-de-teste/novo');
    await page.getByTestId('testcase-save-button').click();
    await expect(page.getByTestId('testcase-title-field-error')).toBeVisible();
    await expect(page).toHaveURL(/\/casos-de-teste\/novo$/);
  });

  test('convite com e-mail inválido é recusado', async ({ workspace }) => {
    const { page } = workspace;
    const users = new UsersPage(page);

    await users.goto();
    await users.inviteButton.click();
    await users.emailInput.fill('isto-nao-e-um-email');
    await users.submitButton.click();
    await expect(page.getByTestId('users-invite-email-error')).toBeVisible();
    await expect(users.inviteModal).toBeVisible();
  });

  test('cadastro com e-mail já usado é recusado', async ({ loggedInPage: page, user }) => {
    await new DashboardPage(page).logout();

    const register = new RegisterPage(page);
    await register.registerAs({ ...newTestUser(), email: user.email });
    await expect(page.getByTestId('register-email-error')).toBeVisible();
    await expect(page).toHaveURL(/\/cadastro$/);
  });
});
