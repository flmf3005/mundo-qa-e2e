import { expect, test, type Locator, type Page } from '@playwright/test';
import type { TestUser } from '../utils/data';

// A API limita o cadastro (5 por minuto por IP). Esperas, em ms, entre uma tentativa e a próxima; a janela é de 60 s.
const THROTTLE_BACKOFF_MS = [20_000, 30_000, 40_000, 60_000];
const THROTTLED = /too many requests|throttler/i;

export class RegisterPage {
  readonly form: Locator;
  readonly nameInput: Locator;
  readonly organizationInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly formError: Locator;
  readonly emailError: Locator;
  readonly loginLink: Locator;

  constructor(private readonly page: Page) {
    this.form = page.getByTestId('register-form');
    this.nameInput = page.getByTestId('register-name-input');
    this.organizationInput = page.getByTestId('register-organization-input');
    this.emailInput = page.getByTestId('register-email-input');
    this.passwordInput = page.getByTestId('register-password-input');
    this.submitButton = page.getByTestId('register-submit-button');
    this.formError = page.getByTestId('register-form-error');
    this.emailError = page.getByTestId('register-email-error');
    this.loginLink = page.getByTestId('register-login-link');
  }

  async goto() {
    await this.page.goto('/cadastro');
    await expect(this.form).toBeVisible();
  }

  /**
   * Cria a conta e a organização; ao terminar, o app já leva ao painel com a sessão aberta.
   *
   * Se a API recusar por excesso de requisições, espera e reenvia o mesmo formulário (os campos continuam
   * preenchidos). Assim o teste não falha por algo que ele não verifica. Qualquer outro desfecho, inclusive
   * erro de validação, é devolvido como está para o teste conferir (ex.: "e-mail já usado").
   */
  async registerAs(user: TestUser) {
    await this.goto();
    await this.nameInput.fill(user.name);
    await this.organizationInput.fill(user.organizationName);
    await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.password);

    for (let attempt = 0; ; attempt++) {
      await this.submitButton.click();
      if (!(await this.wasThrottled())) return;

      const wait = THROTTLE_BACKOFF_MS[attempt];
      if (wait === undefined) {
        throw new Error(`Cadastro recusado por excesso de requisições após ${attempt + 1} tentativas.`);
      }
      test.info().annotations.push({
        type: 'cadastro-limitado',
        description: `Too Many Requests; nova tentativa em ${wait / 1000}s (tentativa ${attempt + 1})`,
      });
      await this.page.waitForTimeout(wait);
    }
  }

  /** Espera o desfecho do envio (painel, erro de e-mail ou erro geral) e diz se foi o bloqueio por excesso de requisições. */
  private async wasThrottled(): Promise<boolean> {
    const dashboard = this.page.getByTestId('dashboard-page');
    const outcome = dashboard.or(this.emailError).or(this.formError);
    try {
      await outcome.first().waitFor({ state: 'visible', timeout: 15_000 });
    } catch {
      return false; // sem desfecho reconhecível: o teste decide o que fazer
    }
    if (!(await this.formError.isVisible())) return false;
    return THROTTLED.test((await this.formError.textContent()) ?? '');
  }
}
