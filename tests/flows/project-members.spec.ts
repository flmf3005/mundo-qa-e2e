import { expect, test } from '../../src/fixtures';
import { emailId } from '../../src/utils/data';

test.describe('Membros do projeto', { tag: '@writes' }, () => {
  test('criador entra como Lead, não pode ser rebaixado e o formulário exige uma pessoa', async ({ workspace }) => {
    const { page, user, project } = workspace;

    await page.goto('/projetos');
    await page.getByTestId(`projects-link-${project.key.toLowerCase()}`).click();
    await expect(page.getByTestId('project-detail-page')).toBeVisible();
    await page.getByTestId('project-detail-tab-members').click();

    await expect(page.getByTestId(`project-members-table-row-${emailId(user.email)}`)).toBeVisible();
    const role = page.getByTestId(`project-members-role-select-${emailId(user.email)}`);
    await expect(role).toHaveValue('LEAD');
    await expect(role.locator('option')).toHaveText(['Responsável (Lead)', 'Tester', 'Desenvolvedor', 'Visualizador']);

    await test.step('o último Lead não pode ser rebaixado', async () => {
      await role.selectOption('TESTER');
      await expect(role).toHaveValue('LEAD');
    });

    await test.step('adicionar sem escolher ninguém é recusado', async () => {
      await page.getByTestId('project-members-add-button').click();
      await expect(page.getByTestId('project-members-add-modal')).toBeVisible();
      // Só existe o dono na organização: a lista de candidatos fica vazia.
      await expect(page.getByTestId('project-members-add-user-select').locator('option')).toHaveCount(1);
      await page.getByTestId('project-members-add-submit').click();
      await expect(page.getByTestId('project-members-add-error')).toBeVisible();
    });
  });
});
