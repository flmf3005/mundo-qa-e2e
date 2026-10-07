import { expect, type Locator, type Page } from '@playwright/test';

export interface TestCaseData {
  title: string;
  action: string;
  expected: string;
}

export class TestCasePage {
  readonly titleInput: Locator;
  readonly statusSelect: Locator;
  readonly addStepButton: Locator;
  readonly firstStep: Locator;
  readonly firstStepAction: Locator;
  readonly firstStepExpected: Locator;
  readonly saveButton: Locator;
  readonly versionBadge: Locator;

  constructor(private readonly page: Page) {
    this.titleInput = page.getByTestId('testcase-title-input');
    this.statusSelect = page.getByTestId('testcase-status-select');
    this.addStepButton = page.getByTestId('testcase-step-add');
    this.firstStep = page.getByTestId('testcase-step-1');
    this.firstStepAction = page.getByTestId('testcase-step-1-action-input');
    this.firstStepExpected = page.getByTestId('testcase-step-1-expected-input');
    this.saveButton = page.getByTestId('testcase-save-button');
    this.versionBadge = page.getByTestId('testcase-version-badge');
  }

  /** Cria um caso com status "Ativo" (só casos ativos entram em ciclos) e um passo. */
  async createActive(data: TestCaseData) {
    await this.page.goto('/casos-de-teste/novo');
    await this.titleInput.fill(data.title);
    await this.statusSelect.selectOption({ label: 'Ativo' });
    if (!(await this.firstStep.isVisible())) await this.addStepButton.click();
    await this.firstStepAction.fill(data.action);
    await this.firstStepExpected.fill(data.expected);
    await this.saveButton.click();
    await expect(this.page).toHaveURL(/\/casos-de-teste\/[0-9a-f-]{36}$/);
    await expect(this.versionBadge).toBeVisible();
  }
}

export class TestCasesListPage {
  constructor(private readonly page: Page) {}

  row(caseKey: string): Locator {
    return this.page.getByTestId(`testcases-table-row-${caseKey.toLowerCase()}`);
  }

  async goto() {
    await this.page.goto('/casos-de-teste');
    await expect(this.page.getByTestId('testcases-page')).toBeVisible();
  }
}
