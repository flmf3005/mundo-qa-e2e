import { expect, type Locator, type Page } from '@playwright/test';

export class CyclePage {
  readonly nameInput: Locator;
  readonly pickButton: Locator;
  readonly pickerConfirm: Locator;
  readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.nameInput = page.getByTestId('cycle-new-name-input');
    this.pickButton = page.getByTestId('cycle-new-pick-button');
    this.pickerConfirm = page.getByTestId('cycle-new-picker-confirm');
    this.submitButton = page.getByTestId('cycle-new-submit');
  }

  /** Cria um ciclo com o caso indicado e devolve a URL do ciclo criado. */
  async create(name: string, caseKey: string): Promise<string> {
    await this.page.goto('/execucoes/ciclos/novo');
    await this.nameInput.fill(name);
    await this.pickButton.click();
    await this.page.getByTestId(`cycle-new-picker-case-${caseKey.toLowerCase()}`).click();
    await this.pickerConfirm.click();
    await this.submitButton.click();
    await expect(this.page).toHaveURL(/\/execucoes\/ciclos\/[0-9a-f-]{36}$/);
    return this.page.url();
  }

  async openRun(caseKey: string) {
    await this.page.getByTestId(`cycle-run-${caseKey.toLowerCase()}`).click();
    await expect(this.page.getByTestId('run-page')).toBeVisible();
  }
}

export class RunPage {
  readonly currentStatus: Locator;
  readonly saveButton: Locator;
  readonly newBugButton: Locator;

  constructor(private readonly page: Page) {
    this.currentStatus = page.getByTestId('run-current-status');
    this.saveButton = page.getByTestId('run-save');
    this.newBugButton = page.getByTestId('run-bugs-new');
  }

  /** Marca o passo como falho, descreve o resultado obtido, define o resultado do caso e salva. */
  async failStep(step: number, actualResult: string) {
    await this.page.getByTestId(`run-step-${step}-failed`).click();
    await this.page.getByTestId(`run-step-${step}-actual`).fill(actualResult);
    await this.page.getByTestId('run-status-failed').click();
    await this.saveButton.click();
    await expect(this.currentStatus).toContainText('Falhou');
  }
}
