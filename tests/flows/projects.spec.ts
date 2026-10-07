import { expect, test } from '../../src/fixtures';
import { ProjectsPage } from '../../src/pages/projects.page';

test.describe('Projetos', { tag: '@writes' }, () => {
  test('o projeto criado fica selecionado no cabeçalho e aparece na lista', async ({ workspace }) => {
    const projects = new ProjectsPage(workspace.page);
    await expect(projects.currentProject).toContainText(workspace.project.key);

    await projects.goto();
    await expect(projects.row(workspace.project.key)).toBeVisible();
    await expect(projects.row(workspace.project.key)).toContainText(workspace.project.name);
  });
});
