import { expect, test } from '../../src/fixtures';
import { CyclePage, RunPage } from '../../src/pages/cycle.page';
import { DashboardPage } from '../../src/pages/dashboard.page';
import { IssueFormPage, IssuePage } from '../../src/pages/issue.page';
import { TestCasePage } from '../../src/pages/test-case.page';

// A jornada principal de um QA, de ponta a ponta, num único teste com etapas (aparecem no relatório e no trace).
// Cada execução usa uma organização nova, então roda em paralelo e repete sem depender de estado anterior.
test.describe('Jornada do QA', { tag: '@writes' }, () => {
  test('do caso de teste ao bug ligado à execução que falhou', async ({ workspace }) => {
    // Jornada longa (cadastro + 5 etapas): no WebKit passa de 60s, o limite padrão do projeto.
    test.setTimeout(120_000);
    const { page, project, firstCaseKey } = workspace;
    const caseKey = firstCaseKey;

    await test.step('cria um caso de teste ativo com um passo', async () => {
      await new TestCasePage(page).createActive({
        title: 'Login com credenciais válidas',
        action: 'Informar e-mail e senha e clicar em Entrar',
        expected: 'O painel é exibido',
      });
    });

    await test.step('cria um ciclo com o caso e abre a execução', async () => {
      await new CyclePage(page).create('Regressão E2E', caseKey);
      await new CyclePage(page).openRun(caseKey);
    });

    await test.step('executa o passo com falha e salva o resultado', async () => {
      await new RunPage(page).failStep(1, 'Apareceu a mensagem "Erro inesperado"');
    });

    await test.step('registra o bug a partir da falha, já preenchido e ligado à execução', async () => {
      await new RunPage(page).newBugButton.click();

      const form = new IssueFormPage(page);
      await expect(form.fromExecution).toBeVisible();
      await expect(form.titleInput).toHaveValue(new RegExp(caseKey));
      await form.submit();

      const issue = new IssuePage(page);
      await expect(issue.key).toHaveText(`${project.key}-BUG-1`);
      await expect(issue.linkedTestCase).toContainText(caseKey);
    });

    await test.step('o painel reflete o resultado: 1 bug aberto e 1 execução', async () => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await expect(dashboard.stat('open-bugs')).toHaveText('1');
      await expect(dashboard.stat('executions')).toHaveText('1');
    });
  });
});
