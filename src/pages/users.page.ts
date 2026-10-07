import { expect, type Locator, type Page } from '@playwright/test';
import { emailId } from '../utils/data';

export class UsersPage {
  readonly root: Locator;
  readonly inviteButton: Locator;
  readonly inviteModal: Locator;
  readonly emailInput: Locator;
  readonly roleSelect: Locator;
  readonly submitButton: Locator;
  readonly invitesTable: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByTestId('users-page');
    this.inviteButton = page.getByTestId('users-invite-button');
    this.inviteModal = page.getByTestId('users-invite-modal');
    this.emailInput = page.getByTestId('users-invite-email-input');
    this.roleSelect = page.getByTestId('users-invite-role-select');
    this.submitButton = page.getByTestId('users-invite-submit');
    this.invitesTable = page.getByTestId('invites-table');
  }

  async goto() {
    await this.page.goto('/usuarios');
    await expect(this.root).toBeVisible();
  }

  memberRow(email: string): Locator {
    return this.page.getByTestId(`users-table-row-${emailId(email)}`);
  }

  inviteRow(email: string): Locator {
    return this.page.getByTestId(`invites-table-row-${emailId(email)}`);
  }

  revokeButton(email: string): Locator {
    return this.page.getByTestId(`invites-revoke-${emailId(email)}`);
  }

  /** Envia um convite com o papel (valor do enum, ex.: `TESTER`) e espera o modal fechar. */
  async invite(email: string, role: string) {
    await this.inviteButton.click();
    await this.emailInput.fill(email);
    await this.roleSelect.selectOption(role);
    await this.submitButton.click();
    await expect(this.inviteModal).toBeHidden();
  }
}
