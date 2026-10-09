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
- Respeitar o rate limit da API: o cadastro aceita 5 por minuto (`@Throttle` em `auth.controller.ts`) e cada teste `@writes` cria uma conta, então rodar muitos em sequência rápida dá `ThrottlerException: Too Many Requests` (a tela de cadastro mostra isso em `register-form-error`, e o sintoma no teste é `dashboard-page` não aparecer). Defesas atuais: `RegisterPage.registerAs` espera e reenvia quando recebe esse bloqueio (anotação `cadastro-limitado` no relatório); o CI usa 2 workers nos testes sem `@writes`, **1 worker** e **1 navegador por vez** (`max-parallel: 1`) no escopo `all`.
- A chave desse limite **era o IP de um proxy e não o do cliente** (achado de 09/10/2026), o que fazia o limite ser compartilhado entre desconhecidos e entre os jobs do CI. Corrigido com `TRUST_PROXY=3` no Render (valor medido, não deduzido). A variável é do painel do Render e `/api/health` não a mostra: confirme com `npm run probe:throttle` e `npm run probe:throttle -- --spoof` (5 passando e 0 depois do primeiro 429 nas duas, com 1 min entre elas).

## Estado atual (atualizado em 09/10/2026)

**Pronto e publicado em `main`** (repositório flmf3005/mundo-qa-e2e, CI verde nos 3 navegadores):

- Playwright 1.63 + TypeScript, Node 24, licença MIT.
- 25 testes (19 com `@writes`), todos verdes no Chromium contra o staging (suíte completa em ~8 min com 1 worker): API de saúde, telas públicas, login inválido, cadastro/login, projetos, casos de teste, jornada do QA, execução com sucesso, ciclo concluído/reaberto, bloqueado e ignorado com relatórios CSV/PDF e reteste, edição concorrente, planos, membros do projeto, usuários e convites (só o lado do Proprietário) e validações de formulário.
- Page Objects em `src/pages`, fixtures `user`, `loggedInPage` e `workspace` (conta nova + projeto).
- CI com matriz chromium/firefox/webkit; push e PR rodam só o que não é `@writes`; o agendamento noturno e o manual com `scope = all` rodam tudo (1 worker, 1 navegador por vez, job com timeout de 45 min). A instalação do navegador tem limite de 8 min por tentativa e até 3 tentativas, porque o download do apt já travou o job do WebKit por 20 min.
- Script `npm run cleanup` e job `cleanup` noturno (ver "Limpeza"), já com o secret `DATABASE_URL` e a variável `CLEANUP_DB_HOST` configurados pelo dono. O staging foi limpo uma vez à mão (26 organizações E2E).

**Pendente:**

1. **Validar a próxima execução agendada** (o evento `schedule` roda às 09:00 UTC, mas já atrasou ~7 h; olhar a aba Actions). Contexto: a de 08/10 (run 37806919322) teve falhas nos 3 navegadores, todas causadas pelo limite de cadastro (tela com `ThrottlerException: Too Many Requests`), e o `cleanup` funcionou: apagou 104 organizações e 104 usuários, "Concluído sem erros", mesmo com os testes falhando. As correções (espera e reenvio no cadastro, 1 navegador por vez) foram publicadas em 09/10 (commit `16d638c`). Esperado agora: jobs em sequência com `Escopo: all`, 25 testes cada (mais o `register-throttle`), poucas ou nenhuma falha, e anotações `cadastro-limitado` no relatório HTML nos testes que precisaram esperar. Não confirmado: o `max-parallel` com expressão só foi exercitado no caminho de `push` (valendo 3); o caminho `all` (valendo 1) ainda não rodou. Com o `trust proxy` corrigido, cada runner do GitHub passa a ter contador próprio (por IP), então o `max-parallel: 1` talvez possa voltar a 3 depois que essa execução for validada; não mudar antes.
2. **Fechar o `trust proxy`** (mundo-qa). Resolvido e validado em 09/10/2026: no Render o valor certo é **`TRUST_PROXY=3`** (2 foi a primeira estimativa e estava errada). Medições no staging com `npm run probe:throttle`: com 1 e com 2 a chave variava (de 9 a 12 requisições passavam antes do primeiro 429 e algumas ainda depois; uma sonda longa de 160 requisições deixou passar 34, cerca de 7 contadores); com 3, **exatamente 5 passam e 0 depois**, também com `--spoof` (X-Forwarded-For forjado a cada requisição), então o IP não é forjável. PRs no mundo-qa, todos mergeados: #15 (variável `TRUST_PROXY`, padrão 1), #16 (cache diário do `apk upgrade`, que destravou a varredura de vulnerabilidades) e #17 (`render.yaml` e documentação alinhados a 3). Falta só, no painel do Render, voltar `APP_VERSION` de `staging-tp3` (marcador usado para provar o deploy) para `staging`; é cosmético. O `autoDeploy` é `false`: cada mudança de variável exige deploy manual. Rollback: `TRUST_PROXY=1`. Se o desenho do Render mudar, meça de novo: a menos usa o IP de um proxy, a mais aceita IP forjado.
3. Ampliar a cobertura: anexos (evidências na execução, conferir se o staging tem armazenamento) e importação de casos de teste. Ainda não foram levantados.
4. **Papéis e permissões** (aceitar convite, Visualizador sem botão de criar, Tester sem administrar usuários, Desenvolvedor atualizando bug, adicionar membro ao projeto): dependem de o staging enviar e-mail. O token do convite só sai por e-mail (ou pelo log do servidor, se não houver SMTP) e não há API de reset/seed lá. Quando o e-mail estiver no staging, definir como ler o link (caixa de teste) e escrever esses cenários. Alternativa já descrita: `docker-compose.test.yml` do mundo-qa, que traz um usuário de cada papel e `POST /api/test/reset`.

**Limitações conhecidas:**

- O Firefox do Playwright não abre na máquina do dono (Windows build Insider 26300, erro de `mozglue`). O Firefox é validado só no CI.
- Não existe API para apagar contas; o staging acumula organizações `E2E` entre limpezas.
- O workflow `cleanup` só roda em `schedule`; não há botão manual para ele de propósito.
- Plano arquivado esconde os botões de ação (não há "reativar" na tela), então o teste cobre só arquivar.
- Não confirmado: se um job de teste que estoura `timeout-minutes` impede o `cleanup` (`!cancelled()`). Se acontecer, os dados ficam para a noite seguinte.

**Aprendizados do app (para escrever testes novos sem reabrir o código do mundo-qa):**

- `data-id` com e-mail ou nome no sufixo usa a regra `kebab` do front (minúsculas; o que não é letra ou número vira `-`): `emailId()` em `src/utils/data.ts`. Erros de campo seguem `<data-id do campo>-error` (ex.: `projects-create-key-error`, `users-invite-email-error`, `register-email-error`); erros gerais de formulário são `<tela>-form-error`.
- O seletor de papel do convite lista do maior para o menor (Proprietário … Visualizador). Papéis no projeto: Responsável (Lead), Tester, Desenvolvedor, Visualizador. O último Lead do projeto não pode ser rebaixado (a tela recarrega o valor antigo).
- Criar um plano pelo modal já abre a página dele. Concluir um ciclo trava ciclo e execuções (`cycle-locked-alert`, `run-locked-alert`); reabrir libera.
- Conflito de edição: a API devolve 409 "alterada por outra pessoa" quando `expectedUpdatedAt` está velho; o teste usa uma segunda aba da mesma sessão. O reteste vem com Falharam e Bloqueados marcados e Ignorados desmarcado.
- A fixture `workspace` cria o projeto `QAE`; o primeiro caso é `QAE-TC-1` e o segundo `QAE-TC-2`. Ao esperar navegação para uma URL parecida com a atual, usar `not.toHaveURL(atual)` antes do regex, senão a asserção passa na página antiga.
- O convite só vai por e-mail (`MailService`); sem SMTP o link só aparece no log do servidor. Não há como um teste obtê-lo no staging hoje.

**Ambiente da máquina do dono:** só o Chromium do Playwright está instalado (`npx playwright install chromium`). Não há Python; scripts auxiliares em Node. Windows com Cmder (cmd.exe) para comandos dele.

**Convenções de trabalho com o dono:** comandos para ele rodar em sintaxe Cmder (cmd.exe); nunca ler a `DATABASE_URL`; commit e push só quando ele pedir.
