import { expect, type Locator, type Page } from '@playwright/test';

export class IssueFormPage {
  readonly fromExecution: Locator;
  readonly titleInput: Locator;
  readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.fromExecution = page.getByTestId('issue-new-from-execution');
    this.titleInput = page.getByTestId('issue-new-title-input');
    this.submitButton = page.getByTestId('issue-new-submit');
  }

  async submit() {
    await this.submitButton.click();
    await expect(this.page).toHaveURL(/\/bugs\/[0-9a-f-]{36}$/);
  }
}

export class IssuePage {
  readonly key: Locator;
  readonly linkedTestCase: Locator;

  constructor(page: Page) {
    this.key = page.getByTestId('issue-key');
    this.linkedTestCase = page.getByTestId('issue-field-testcase');
  }
}
