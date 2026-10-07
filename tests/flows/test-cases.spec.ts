import { expect, test } from '../../src/fixtures';
import { TestCasePage, TestCasesListPage } from '../../src/pages/test-case.page';

test.describe('Casos de teste', { tag: '@writes' }, () => {
  test('cria um caso ativo com um passo e ele aparece na lista do projeto', async ({ workspace }) => {
    const testCase = new TestCasePage(workspace.page);
    await testCase.createActive({
      title: 'Login com credenciais válidas',
      action: 'Informar e-mail e senha e clicar em Entrar',
      expected: 'O painel é exibido',
    });

    const list = new TestCasesListPage(workspace.page);
    await list.goto();
    await expect(list.row(workspace.firstCaseKey)).toBeVisible();
    await expect(list.row(workspace.firstCaseKey)).toContainText('Login com credenciais válidas');
  });
});
