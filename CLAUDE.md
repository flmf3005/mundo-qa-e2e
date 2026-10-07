# mundo-qa-e2e

Testes E2E (Playwright + TypeScript) do Mundo QA. Repositório **público**, usado também como portfólio: nunca commitar segredos, credenciais reais ou dados pessoais.

## Sistema testado

- Staging: https://mundoqa-staging.onrender.com (Render, plano que dorme: o `global-setup` espera a API acordar).
- Código da aplicação (outro repositório): GitHub flmf3005/mundo-qa. Localmente, costuma ficar ao lado deste, em `../mundo-qa`.
- Saúde: `GET /api/health` e `GET /api/ready`.
- Rotas do front: `/entrar`, `/cadastro`, `/projetos`, `/casos-de-teste`, `/execucoes`, `/bugs`.
- Papéis por organização: Proprietário, Administrador, QA Lead, Tester, Desenvolvedor, Visualizador.

## Convenções

- Seletores **somente por `data-id`** (`page.getByTestId(...)`, configurado em `testIdAttribute`). O catálogo está em `mundo-qa/docs/data-ids.md` e `mundo-qa/docs/data-ids.catalog.md`. Se faltar um `data-id`, pedir a inclusão no mundo-qa; não usar texto, classe ou posição.
- Page Objects em `src/pages`, fixtures em `src/fixtures`. Asserções ficam nos testes, salvo `expectLoaded()` e similares.
- Cada teste cria os próprios dados (`newTestUser()`), com identificadores únicos e prefixo `E2E`. Não há seed nem credencial fixa no staging.
- Testes que criam dados no ambiente levam a tag `@writes`; verificações rápidas levam `@smoke`.
- Não há API de reset no staging (`ENABLE_TEST_API` só existe no ambiente descartável do mundo-qa). Para um banco limpo, usar o `docker-compose.test.yml` do mundo-qa e `BASE_URL=http://localhost:8081`.

## Limpeza

- `npm run cleanup` (`scripts/cleanup-e2e.ts`) remove contas e organizações E2E direto no banco; não existe API para isso.
- Dry-run por padrão; apagar exige `--apply --confirm-host=<host>`. Só casa `E2E Org <8 hex>` e `e2e-<8 hex>@mundoqa-e2e.test`.
- A `DATABASE_URL` é do usuário e nunca deve ser lida, impressa nem guardada por quem automatiza. Rodar em banco real só com o usuário.

## Comandos

```bash
npm run typecheck
npm run test:readonly     # sem criar dados
npm test                  # tudo
```

## Cuidados

- O staging é compartilhado e tem dados reais de uso: não rodar testes destrutivos nem em massa sem avisar o dono.
- Respeitar o rate limit da API: poucos workers (2 no CI).
