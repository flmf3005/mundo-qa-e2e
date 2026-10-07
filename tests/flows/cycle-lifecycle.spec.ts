import { expect, test } from '../../src/fixtures';
import { CyclePage, RunPage } from '../../src/pages/cycle.page';
import { TestCasePage } from '../../src/pages/test-case.page';

const caseData = (title: string) => ({ title, action: 'Executar a ação', expected: 'O resultado esperado aparece' });

test.describe('Ciclo de execução', { tag: '@writes' }, () => {
  test('concluir trava os resultados e reabrir libera', async ({ workspace }) => {
    test.setTimeout(120_000);
    const { page, firstCaseKey } = workspace;
    const cycle = new CyclePage(page);

    await new TestCasePage(page).createActive(caseData('Caso do ciclo concluído'));
    const cycleUrl = await cycle.create('Ciclo para concluir', firstCaseKey);
    await cycle.openRun(firstCaseKey);
    await new RunPage(page).passAll();

    await page.goto(cycleUrl);
    await cycle.complete();
    await expect(cycle.lockedAlert).toBeVisible();
    await expect(cycle.completeButton).toBeHidden();

    await page.getByTestId(`cycle-run-link-${firstCaseKey.toLowerCase()}`).click();
    await expect(new RunPage(page).lockedAlert).toBeVisible();

    await page.goto(cycleUrl);
    await cycle.reopen();
    await expect(cycle.lockedAlert).toBeHidden();
    await expect(cycle.completeButton).toBeVisible();
  });

  test('bloqueado e ignorado entram no resumo, no relatório e no reteste', async ({ workspace }) => {
    test.setTimeout(180_000);
    const { page } = workspace;
    const cycle = new CyclePage(page);
    const [blockedKey, skippedKey] = ['QAE-TC-1', 'QAE-TC-2'];

    await new TestCasePage(page).createActive(caseData('Caso que fica bloqueado'));
    await new TestCasePage(page).createActive(caseData('Caso que é ignorado'));
    const cycleUrl = await cycle.create('Ciclo com bloqueio', [blockedKey, skippedKey]);

    await cycle.openRun(blockedKey);
    await new RunPage(page).setResult('blocked', 'Bloqueado');
    await page.goto(cycleUrl);
    await cycle.openRun(skippedKey);
    await new RunPage(page).setResult('skipped', 'Ignorado');

    await page.goto(cycleUrl);
    await expect(cycle.stat('total')).toHaveText('2');
    await expect(cycle.stat('blocked')).toHaveText('1');
    await expect(cycle.stat('skipped')).toHaveText('1');
    await expect(cycle.stat('pending')).toHaveText('0');
    await expect(cycle.caseStatus(blockedKey)).toContainText('Bloqueado');
    await expect(cycle.caseStatus(skippedKey)).toContainText('Ignorado');

    await test.step('relatórios em CSV e PDF são baixados', async () => {
      for (const kind of ['csv', 'pdf']) {
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          page.getByTestId(`cycle-report-${kind}`).click(),
        ]);
        expect(download.suggestedFilename()).toMatch(new RegExp(`\.${kind}$`));
      }
    });

    await test.step('reteste cria um ciclo novo com os casos que não passaram', async () => {
      await cycle.retestButton.click();
      await expect(page.getByTestId('cycle-retest-name-input')).toHaveValue('Ciclo com bloqueio (reteste)');
      await page.getByTestId('cycle-retest-skipped').click();
      await page.getByTestId('cycle-retest-submit').click();

      await expect(page).not.toHaveURL(cycleUrl);
      await expect(page).toHaveURL(/\/execucoes\/ciclos\/[0-9a-f-]{36}$/);
      await expect(page.getByTestId('cycle-title')).toContainText('Ciclo com bloqueio (reteste)');
      await expect(cycle.stat('total')).toHaveText('2');
      await expect(cycle.stat('pending')).toHaveText('2');
    });
  });

  test('salvar uma execução alterada em outra aba mostra o aviso de conflito', async ({ workspace }) => {
    test.setTimeout(120_000);
    const { page, firstCaseKey } = workspace;
    const cycle = new CyclePage(page);

    await new TestCasePage(page).createActive(caseData('Caso com edição concorrente'));
    const cycleUrl = await cycle.create('Ciclo concorrente', firstCaseKey);
    await cycle.openRun(firstCaseKey);
    const runUrl = page.url();

    // Mesma sessão em uma segunda aba: salva primeiro, deixando a primeira aba desatualizada.
    const other = await page.context().newPage();
    await other.goto(runUrl);
    await new RunPage(other).passAll();
    await other.close();

    const run = new RunPage(page);
    await page.getByTestId('run-status-blocked').click();
    await run.saveButton.click();
    await expect(run.conflictAlert).toBeVisible();

    await run.reloadButton.click();
    await expect(run.conflictAlert).toBeHidden();
    await expect(run.currentStatus).toContainText('Passou');
    await page.goto(cycleUrl);
    await expect(cycle.stat('passed')).toHaveText('1');
  });
});
