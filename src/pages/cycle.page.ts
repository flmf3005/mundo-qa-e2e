import { expect, type Locator, type Page } from '@playwright/test';

export class CyclePage {
  readonly nameInput: Locator;
  readonly pickButton: Locator;
  readonly pickerConfirm: Locator;
  readonly submitButton: Locator;
  readonly statusBadge: Locator;
  readonly lockedAlert: Locator;
  readonly completeButton: Locator;
  readonly completeConfirm: Locator;
  readonly reopenButton: Locator;
  readonly retestButton: Locator;

  constructor(private readonly page: Page) {
    this.nameInput = page.getByTestId('cycle-new-name-input');
    this.pickButton = page.getByTestId('cycle-new-pick-button');
    this.pickerConfirm = page.getByTestId('cycle-new-picker-confirm');
    this.submitButton = page.getByTestId('cycle-new-submit');
    this.statusBadge = page.getByTestId('cycle-status-badge');
    this.lockedAlert = page.getByTestId('cycle-locked-alert');
    this.completeButton = page.getByTestId('cycle-complete-button');
    this.completeConfirm = page.getByTestId('cycle-complete-confirm');
    this.reopenButton = page.getByTestId('cycle-reopen-button');
    this.retestButton = page.getByTestId('cycle-retest-button');
  }

  /** Cria um ciclo com os casos indicados (opcionalmente dentro de um plano) e devolve a URL do ciclo criado. */
  async create(name: string, caseKeys: string | string[], options: { planId?: string } = {}): Promise<string> {
    await this.page.goto(options.planId ? `/execucoes/ciclos/novo?plano=${options.planId}` : '/execucoes/ciclos/novo');
    await this.nameInput.fill(name);
    await this.pickButton.click();
    for (const key of [caseKeys].flat()) {
      await this.page.getByTestId(`cycle-new-picker-case-${key.toLowerCase()}`).click();
    }
    await this.pickerConfirm.click();
    await this.submitButton.click();
    await expect(this.page).toHaveURL(/\/execucoes\/ciclos\/[0-9a-f-]{36}$/);
    return this.page.url();
  }

  async openRun(caseKey: string) {
    await this.page.getByTestId(`cycle-run-${caseKey.toLowerCase()}`).click();
    await expect(this.page.getByTestId('run-page')).toBeVisible();
  }

  stat(name: 'total' | 'passed' | 'failed' | 'blocked' | 'skipped' | 'pending' | 'rate'): Locator {
    return this.page.getByTestId(`cycle-stat-${name}`);
  }

  caseStatus(caseKey: string): Locator {
    return this.page.getByTestId(`cycle-status-${caseKey.toLowerCase()}`);
  }

  async complete() {
    await this.completeButton.click();
    await this.completeConfirm.click();
    await expect(this.statusBadge).toHaveText('Concluído');
  }

  async reopen() {
    await this.reopenButton.click();
    await expect(this.statusBadge).not.toHaveText('Concluído');
  }
}

export class RunPage {
  readonly currentStatus: Locator;
  readonly saveButton: Locator;
  readonly newBugButton: Locator;
  readonly lockedAlert: Locator;
  readonly conflictAlert: Locator;
  readonly reloadButton: Locator;

  constructor(private readonly page: Page) {
    this.currentStatus = page.getByTestId('run-current-status');
    this.saveButton = page.getByTestId('run-save');
    this.newBugButton = page.getByTestId('run-bugs-new');
    this.lockedAlert = page.getByTestId('run-locked-alert');
    this.conflictAlert = page.getByTestId('run-conflict-alert');
    this.reloadButton = page.getByTestId('run-reload-button');
  }

  /** Marca o passo como falho, descreve o resultado obtido, define o resultado do caso e salva. */
  async failStep(step: number, actualResult: string) {
    await this.page.getByTestId(`run-step-${step}-failed`).click();
    await this.page.getByTestId(`run-step-${step}-actual`).fill(actualResult);
    await this.page.getByTestId('run-status-failed').click();
    await this.saveButton.click();
    await expect(this.currentStatus).toContainText('Falhou');
  }

  /** Marca todos os passos como aprovados, define o resultado do caso como aprovado e salva. */
  async passAll() {
    await this.page.getByTestId('run-all-passed').click();
    await this.page.getByTestId('run-status-passed').click();
    await this.saveButton.click();
    await expect(this.currentStatus).toContainText('Passou');
  }

  /** Define só o resultado do caso (sem mexer nos passos) e salva. */
  async setResult(result: 'blocked' | 'skipped', label: string) {
    await this.page.getByTestId(`run-status-${result}`).click();
    await this.saveButton.click();
    await expect(this.currentStatus).toContainText(label);
  }
}
