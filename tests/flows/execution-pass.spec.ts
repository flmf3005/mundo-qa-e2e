import { expect, test } from '../../src/fixtures';
import { CyclePage, RunPage } from '../../src/pages/cycle.page';
import { DashboardPage } from '../../src/pages/dashboard.page';
import { TestCasePage } from '../../src/pages/test-case.page';

test.describe('Execução com sucesso', { tag: '@writes' }, () => {
  test('caso aprovado atualiza o ciclo e o painel sem gerar bug', async ({ workspace }) => {
    test.setTimeout(120_000);
    const { page, firstCaseKey } = workspace;

    await new TestCasePage(page).createActive({
      title: 'Cadastro de usuário',
      action: 'Preencher o formulário e enviar',
      expected: 'A conta é criada',
    });
    const cycleUrl = await new CyclePage(page).create('Smoke E2E', firstCaseKey);
    await new CyclePage(page).openRun(firstCaseKey);
    await new RunPage(page).passAll();

    await page.goto(cycleUrl);
    await expect(page.getByTestId('cycle-stat-passed')).toContainText('1');
    await expect(page.getByTestId('cycle-stat-failed')).toContainText('0');

    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await expect(dashboard.stat('executions')).toHaveText('1');
    await expect(dashboard.stat('open-bugs')).toHaveText('0');
  });
});
