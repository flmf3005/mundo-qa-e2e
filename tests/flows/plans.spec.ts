import { expect, test } from '../../src/fixtures';
import { CyclePage, RunPage } from '../../src/pages/cycle.page';
import { PlanDetailPage, PlansPage } from '../../src/pages/plan.page';
import { TestCasePage } from '../../src/pages/test-case.page';

test.describe('Planos de execução', { tag: '@writes' }, () => {
  test('plano agrupa um ciclo e reflete o progresso da execução', async ({ workspace }) => {
    test.setTimeout(150_000);
    const { page, firstCaseKey } = workspace;
    const plan = new PlanDetailPage(page);

    await new TestCasePage(page).createActive({ title: 'Caso do plano', action: 'Executar', expected: 'Funciona' });
    const planUrl = await new PlansPage(page).create('Plano E2E Release 1');
    await expect(plan.title).toContainText('Plano E2E Release 1');
    await expect(plan.stat('total')).toHaveText('0');
    const planId = planUrl.split('/').pop()!;

    const cycleUrl = await new CyclePage(page).create('Ciclo do plano', firstCaseKey, { planId });
    await new CyclePage(page).openRun(firstCaseKey);
    await new RunPage(page).passAll();

    await page.goto(planUrl);
    await expect(plan.cycleLink('Ciclo do plano')).toBeVisible();
    await expect(plan.stat('total')).toHaveText('1');
    await expect(plan.stat('passed')).toHaveText('1');
    await expect(plan.stat('rate')).toHaveText('100%');

    await plan.cycleLink('Ciclo do plano').click();
    await expect(page).toHaveURL(cycleUrl);
  });

  test('plano vazio pode ser editado e excluído', async ({ workspace }) => {
    const { page } = workspace;
    const plans = new PlansPage(page);
    const plan = new PlanDetailPage(page);

    await plans.create('Plano para editar');
    await page.getByTestId('plan-edit-button').click();
    await page.getByTestId('plan-edit-name-input').fill('Plano editado');
    await page.getByTestId('plan-edit-submit').click();
    await expect(plan.title).toContainText('Plano editado');

    await page.getByTestId('plan-delete-button').click();
    await page.getByTestId('plan-delete-confirm').click();
    await plans.goto();
    await plans.plansTab.click();
    await expect(page.getByTestId('plans-empty')).toBeVisible();
  });

  test('plano arquivado fica marcado e não aceita mais ações', async ({ workspace }) => {
    const { page } = workspace;
    const plan = new PlanDetailPage(page);

    await new PlansPage(page).create('Plano para arquivar');
    await page.getByTestId('plan-archive-button').click();
    await expect(plan.archivedBadge).toBeVisible();
    await expect(page.getByTestId('plan-edit-button')).toBeHidden();
    await expect(page.getByTestId('plan-new-cycle')).toBeHidden();
  });

  test('plano sem nome é recusado', async ({ workspace }) => {
    const { page } = workspace;
    const plans = new PlansPage(page);

    await plans.goto();
    await plans.newPlanButton.click();
    await plans.submitButton.click();
    await expect(plans.createError).toBeVisible();
  });
});
