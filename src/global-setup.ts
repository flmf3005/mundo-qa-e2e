import type { FullConfig } from '@playwright/test';

const ATTEMPTS = 18;
const WAIT_MS = 5_000;

/**
 * O staging roda num plano do Render que "dorme" após inatividade. Antes de começar, espera a API
 * responder para que a primeira requisição de um teste não estoure o timeout por causa do cold start.
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL;
  if (!baseURL) throw new Error('baseURL não definida no playwright.config.ts');

  const url = new URL('/api/health', baseURL).toString();
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (res.ok) {
        console.log(`[warm-up] ${url} respondeu ${res.status} (tentativa ${attempt})`);
        return;
      }
      console.log(`[warm-up] ${url} respondeu ${res.status}, aguardando...`);
    } catch {
      console.log(`[warm-up] ${url} sem resposta (tentativa ${attempt}/${ATTEMPTS}), aguardando...`);
    }
    await new Promise((resolve) => setTimeout(resolve, WAIT_MS));
  }
  throw new Error(`O ambiente não respondeu em ${(ATTEMPTS * WAIT_MS) / 1000}s: ${url}`);
}
