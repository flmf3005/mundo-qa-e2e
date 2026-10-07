import { expect, type Locator, type Page } from '@playwright/test';

export class PlansPage {
  readonly newPlanButton: Locator;
  readonly plansTab: Locator;
  readonly nameInput: Locator;
  readonly submitButton: Locator;
  readonly createError: Locator;

  constructor(private readonly page: Page) {
    this.newPlanButton = page.getByTestId('executions-new-plan');
    this.plansTab = page.getByTestId('executions-tab-plans');
    this.nameInput = page.getByTestId('plan-create-name-input');
    this.submitButton = page.getByTestId('plan-create-submit');
    this.createError = page.getByTestId('plan-create-error');
  }

  async goto() {
    await this.page.goto('/execucoes?aba=planos');
    await expect(this.page.getByTestId('executions-page')).toBeVisible();
  }

  /** Cria o plano pelo modal (o app abre a página do plano ao terminar) e devolve a URL. */
  async create(name: string): Promise<string> {
    await this.goto();
    await this.newPlanButton.click();
    await this.nameInput.fill(name);
    await this.submitButton.click();
    await expect(this.page.getByTestId('plan-page')).toBeVisible();
    return this.page.url();
  }
}

export class PlanDetailPage {
  readonly title: Locator;
  readonly archivedBadge: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('plan-title');
    this.archivedBadge = page.getByTestId('plan-archived-badge');
  }

  stat(name: 'total' | 'done' | 'passed' | 'failed' | 'blocked' | 'rate'): Locator {
    return this.page.getByTestId(`plan-stat-${name}`);
  }

  cycleLink(name: string): Locator {
    return this.page.getByTestId(`plan-cycle-link-${kebab(name)}`);
  }
}

/** Mesma regra de `kebab` do front, para montar `data-id` a partir de nomes. */
function kebab(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}
