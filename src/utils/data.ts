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
