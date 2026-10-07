import { expect, test } from '../../src/fixtures';
import { UsersPage } from '../../src/pages/users.page';
import { newInviteeEmail } from '../../src/utils/data';

// Sem acesso ao e-mail do convite no staging, cobre-se o lado de quem convida (Proprietário).
// Aceitar o convite e testar os outros papéis fica para quando houver um canal para ler o link.
test.describe('Usuários e convites', { tag: '@writes' }, () => {
  test('proprietário vê a si mesmo, oferece os 6 papéis, convida e revoga', async ({ workspace }) => {
    const { page, user } = workspace;
    const users = new UsersPage(page);
    const invitee = newInviteeEmail();

    await users.goto();
    await expect(users.memberRow(user.email)).toBeVisible();

    await users.inviteButton.click();
    await expect(users.roleSelect.locator('option')).toHaveText([
      'Proprietário',
      'Administrador',
      'QA Lead',
      'Tester',
      'Desenvolvedor',
      'Visualizador',
    ]);
    await page.keyboard.press('Escape');
    await expect(users.inviteModal).toBeHidden();

    await users.invite(invitee, 'TESTER');
    await expect(users.inviteRow(invitee)).toBeVisible();
    await expect(users.inviteRow(invitee)).toContainText('Tester');

    await users.revokeButton(invitee).click();
    await expect(users.inviteRow(invitee)).toBeHidden();
  });
});
