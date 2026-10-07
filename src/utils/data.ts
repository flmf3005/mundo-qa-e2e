import { randomUUID } from 'node:crypto';

export interface TestUser {
  name: string;
  organizationName: string;
  email: string;
  password: string;
}

/**
 * Dados novos a cada chamada. Nada é fixo no repositório: e-mail único e senha gerada na hora,
 * então os testes não dependem de seed nem de credenciais compartilhadas.
 * O prefixo "E2E" permite identificar (e limpar) o que os testes criaram no ambiente.
 */
export function newTestUser(): TestUser {
  const id = randomUUID().slice(0, 8);
  return {
    name: `E2E Tester ${id}`,
    organizationName: `E2E Org ${id}`,
    email: `e2e-${id}@mundoqa-e2e.test`,
    password: `E2e!${randomUUID().replaceAll('-', '').slice(0, 14)}`,
  };
}

/** Sufixo dos `data-id` que embutem um e-mail (mesma regra do front: minúsculas, não alfanuméricos viram `-`). */
export function emailId(email: string): string {
  return email
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/** E-mail de convidado no mesmo padrão das contas E2E, para a limpeza noturna reconhecer. */
export function newInviteeEmail(): string {
  return `e2e-${randomUUID().slice(0, 8)}@mundoqa-e2e.test`;
}
