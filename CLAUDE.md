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
- Automático: o job `cleanup` de `.github/workflows/e2e.yml` roda só no agendamento noturno, após os testes. Usa o secret `DATABASE_URL` e a variável `CLEANUP_DB_HOST` (opcional: `CLEANUP_OLDER_THAN_HOURS`, padrão 0). Apaga tudo que casa com o padrão E2E, inclusive dados de execuções manuais do dia.

## Comandos

```bash
npm run typecheck
npm run test:readonly     # sem criar dados
npm test                  # tudo
```

## Cuidados

- O staging é compartilhado e tem dados reais de uso: não rodar testes destrutivos nem em massa sem avisar o dono.
- Respeitar o rate limit da API: o cadastro aceita 5 por minuto por IP (`@Throttle` em `auth.controller.ts`) e cada teste `@writes` cria uma conta, então rodar muitos em sequência rápida dá `ThrottlerException: Too Many Requests`. Por isso o CI usa 2 workers nos testes sem `@writes` e **1 worker** no escopo `all`.

## Estado atual (atualizado em 07/10/2026, à noite)

**Pronto e publicado em `main`** (repositório flmf3005/mundo-qa-e2e, CI verde nos 3 navegadores):

- Playwright 1.63 + TypeScript, Node 24, licença MIT.
- 25 testes (19 com `@writes`), todos verdes no Chromium contra o staging (suíte completa em ~8 min com 1 worker): API de saúde, telas públicas, login inválido, cadastro/login, projetos, casos de teste, jornada do QA, execução com sucesso, ciclo concluído/reaberto, bloqueado e ignorado com relatórios CSV/PDF e reteste, edição concorrente, planos, membros do projeto, usuários e convites (só o lado do Proprietário) e validações de formulário.
- Page Objects em `src/pages`, fixtures `user`, `loggedInPage` e `workspace` (conta nova + projeto).
- CI com matriz chromium/firefox/webkit; push e PR rodam só o que não é `@writes`; o agendamento noturno e o manual com `scope = all` rodam tudo (1 worker, job com timeout de 45 min). A instalação do navegador tem limite de 8 min por tentativa e até 3 tentativas, porque o download do apt já travou o job do WebKit por 20 min.
- Script `npm run cleanup` e job `cleanup` noturno (ver "Limpeza"), já com o secret `DATABASE_URL` e a variável `CLEANUP_DB_HOST` configurados pelo dono. O staging foi limpo uma vez à mão (26 organizações E2E).

**Pendente:**

1. Conferir o log da **primeira execução agendada** (08/10/2026, ~06:00 de Brasília, evento `schedule`, aba Actions). Esperado: jobs de teste com `Escopo: all` (25 testes cada) e `cleanup` apagando dezenas de organizações (uma por teste `@writes` de execuções manuais do dia, mais a do agendamento). Falhas prováveis: variável/secret com nome ou valor errado, `--confirm-host` diferente do host da URL, falta de `GRANT` no usuário do banco. Em qualquer uma nada é apagado.
2. Ampliar a cobertura: anexos (evidências na execução, conferir se o staging tem armazenamento) e importação de casos de teste. Ainda não foram levantados.
3. **Papéis e permissões** (aceitar convite, Visualizador sem botão de criar, Tester sem administrar usuários, Desenvolvedor atualizando bug, adicionar membro ao projeto): dependem de o staging enviar e-mail. O token do convite só sai por e-mail (ou pelo log do servidor, se não houver SMTP) e não há API de reset/seed lá. Quando o e-mail estiver no staging, definir como ler o link (caixa de teste) e escrever esses cenários. Alternativa já descrita: `docker-compose.test.yml` do mundo-qa, que traz um usuário de cada papel e `POST /api/test/reset`.

**Limitações conhecidas:**

- O Firefox do Playwright não abre na máquina do dono (Windows build Insider 26300, erro de `mozglue`). O Firefox é validado só no CI.
- Não existe API para apagar contas; o staging acumula organizações `E2E` entre limpezas.
- O workflow `cleanup` só roda em `schedule`; não há botão manual para ele de propósito.
- Plano arquivado esconde os botões de ação (não há "reativar" na tela), então o teste cobre só arquivar.
- Não confirmado: se um job de teste que estoura `timeout-minutes` impede o `cleanup` (`!cancelled()`). Se acontecer, os dados ficam para a noite seguinte.

**Convenções de trabalho com o dono:** comandos para ele rodar em sintaxe Cmder (cmd.exe); nunca ler a `DATABASE_URL`; commit e push só quando ele pedir.
