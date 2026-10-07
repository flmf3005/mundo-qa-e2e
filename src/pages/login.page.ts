import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly form: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly formError: Locator;
  readonly registerLink: Locator;
  readonly forgotLink: Locator;

  constructor(private readonly page: Page) {
    this.form = page.getByTestId('login-form');
    this.emailInput = page.getByTestId('login-email-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.submitButton = page.getByTestId('login-submit-button');
    this.formError = page.getByTestId('login-form-error');
    this.registerLink = page.getByTestId('login-register-link');
    this.forgotLink = page.getByTestId('login-forgot-link');
  }

  async goto() {
    await this.page.goto('/entrar');
    await expect(this.form).toBeVisible();
  }

  async loginAs(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
