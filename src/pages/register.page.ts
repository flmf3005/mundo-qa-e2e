import { expect, type Locator, type Page } from '@playwright/test';
import type { TestUser } from '../utils/data';

export class RegisterPage {
  readonly form: Locator;
  readonly nameInput: Locator;
  readonly organizationInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly formError: Locator;
  readonly loginLink: Locator;

  constructor(private readonly page: Page) {
    this.form = page.getByTestId('register-form');
    this.nameInput = page.getByTestId('register-name-input');
    this.organizationInput = page.getByTestId('register-organization-input');
    this.emailInput = page.getByTestId('register-email-input');
    this.passwordInput = page.getByTestId('register-password-input');
    this.submitButton = page.getByTestId('register-submit-button');
    this.formError = page.getByTestId('register-form-error');
    this.loginLink = page.getByTestId('register-login-link');
  }

  async goto() {
    await this.page.goto('/cadastro');
    await expect(this.form).toBeVisible();
  }

  /** Cria a conta e a organização; ao terminar, o app já leva ao painel com a sessão aberta. */
  async registerAs(user: TestUser) {
    await this.goto();
    await this.nameInput.fill(user.name);
    await this.organizationInput.fill(user.organizationName);
    await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.password);
    await this.submitButton.click();
  }
}
