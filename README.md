# mundo-qa-e2e

Testes end-to-end do **Mundo QA** (plataforma de gestão de testes de software) escritos com **Playwright + TypeScript**, rodando contra o ambiente de staging: <https://mundoqa-staging.onrender.com>.

Este repositório é independente do código da aplicação: testa o sistema de fora, como um usuário, e serve também como portfólio de automação de QA.

## O que tem aqui

- **Page Object Model** em `src/pages`, com seletores por `data-id` (a convenção do próprio Mundo QA, nunca texto, classe CSS ou posição).
- **Fixtures** em `src/fixtures`: `user` (dados novos) e `loggedInPage` (sessão aberta a partir de um cadastro real).
- **Dados criados pelo próprio teste**: e-mail único e senha gerada a cada execução, sem seed, sem credenciais no repositório e sem depender de reset do banco.
- **Aquecimento do ambiente** (`src/global-setup.ts`): o staging roda num plano gratuito que "dorme", então a suíte espera a API responder antes de começar.
- **Três navegadores**: Chromium, Firefox e WebKit (Safari).
- **Evidências automáticas** em falhas: trace, screenshot e vídeo, publicados como artefato no CI.
- **CI** (GitHub Actions) com matriz por navegador, execução diária e execução manual.

## Como rodar

Requisitos: Node 24+ (há um `.nvmrc`).

```bash
npm install
npx playwright install        # baixa os navegadores (uma vez)
npm test                      # tudo
npm run test:readonly         # só o que NÃO cria dados no ambiente
npm run test:chromium         # só um navegador
npm run test:ui               # modo interativo
npm run report                # abre o último relatório HTML
```

Para testar outro ambiente, defina `BASE_URL` (veja `.env.example`):

```bash
BASE_URL=http://localhost:8081 npm test
```

## Tags

| Tag | Significado |
| --- | --- |
| `@smoke` | Verificações rápidas de que o ambiente está de pé |
| `@writes` | Cria dados no ambiente (conta e organização com prefixo `E2E`) |

`push` e `pull request` rodam apenas os testes sem `@writes`. A execução diária e a manual com `scope = all` rodam tudo.

## Estrutura

```text
src/
  fixtures/      test.extend com user, loggedInPage e workspace (conta + projeto)
  pages/         Page Objects (login, cadastro, painel, projetos, casos, ciclo/execução, bugs)
  utils/         geração de dados de teste
  global-setup.ts
tests/
  public/        telas e endpoints sem login
  auth/          cadastro e login
  flows/         projetos, casos de teste e a jornada completa do QA
.github/workflows/e2e.yml
```

## Cenários

| Área | O que é verificado |
| --- | --- |
| API | `/api/health` e `/api/ready` respondem |
| Telas públicas | Login, cadastro, redirecionamento de rota protegida |
| Autenticação | Credenciais inválidas; cadastro, logout e novo login |
| Projetos | Projeto criado fica selecionado e aparece na lista |
| Casos de teste | Caso ativo com passo é criado e listado |
| Jornada do QA | Caso → ciclo → execução com falha → bug já preenchido e ligado à execução → painel com 1 bug e 1 execução |
| Execução com sucesso | Caso aprovado: ciclo com 1 aprovado e 0 falhas; painel com 1 execução e 0 bugs |

## Limpeza das contas de teste

Os testes `@writes` deixam organizações e usuários no ambiente. O script `scripts/cleanup-e2e.ts` remove só o que os testes criaram:

```bash
DATABASE_URL=postgresql://... npm run cleanup                     # dry-run: lista, não apaga
DATABASE_URL=postgresql://... npm run cleanup -- --apply --confirm-host=<host do banco>
```

Salvaguardas:

- **Dry-run por padrão.** Para apagar, é preciso `--apply` **e** repetir o host do banco em `--confirm-host`, o que evita rodar no banco errado por engano.
- **Padrões rígidos.** Só entram organizações `E2E Org <8 hex>` cujos membros sejam todos `e2e-<8 hex>@mundoqa-e2e.test`. Uma organização com qualquer membro fora do padrão é ignorada.
- **Só o que já é antigo.** Por padrão ignora o que tem menos de 6 horas (`--older-than=<horas>`; `0` inclui tudo), para não apagar uma execução em andamento.
- **Transação por organização:** um `DELETE` em cascata; se falhar, nada daquela organização é apagado.

A `DATABASE_URL` vem do seu ambiente e nunca é guardada no repositório. Os arquivos de anexo no armazenamento S3 não são apagados (os testes atuais não enviam anexos).

### Usuário do banco só para a limpeza (recomendado)

Em vez da URL principal da API, use um usuário com o mínimo necessário. Crie-o por SQL (no Neon, papéis criados pelo console ou pela API recebem `neon_superuser`, com privilégios bem maiores; por SQL não recebem nada além do que você concede):

```sql
CREATE ROLE e2e_cleanup LOGIN PASSWORD '<senha forte>';
GRANT USAGE ON SCHEMA public TO e2e_cleanup;
GRANT SELECT ON "Organization", "Membership", "User", "Project", "TestCase", "Issue" TO e2e_cleanup;
GRANT DELETE ON "Organization", "User" TO e2e_cleanup;
```

Com isso o script roda inteiro, e as exclusões em cascata das demais tabelas não precisam de permissão extra (o PostgreSQL as executa com os privilégios do dono). O usuário não consegue alterar projetos, casos ou bugs diretamente, ler a auditoria, apagar tabelas nem criar objetos. Se o resumo do script passar a contar outras tabelas, será preciso dar `SELECT` nelas.

### Limpeza automática (noturna)

O workflow `E2E` tem um job `cleanup` que roda **só no agendamento noturno**, depois dos testes, e apaga as contas E2E. Ele apaga tudo que casa com o padrão E2E, inclusive o que foi criado durante o dia por execuções manuais ou locais. Para ligá-lo, configure em *Settings → Secrets and variables → Actions*:

| Tipo | Nome | Valor |
| --- | --- | --- |
| Secret | `DATABASE_URL` | Conexão do banco do ambiente testado (de preferência um usuário do banco só para a limpeza) |
| Variable | `CLEANUP_DB_HOST` | Host do banco, o mesmo que `npm run cleanup` imprime em `Banco:` |
| Variable (opcional) | `CLEANUP_OLDER_THAN_HOURS` | Idade mínima, em horas, do que será apagado. Padrão `0` (tudo) |

Sem o secret e a variável, o job falha avisando o que falta e **não apaga nada**. Execuções que criam dados (agendada e manual com `scope = all`) entram numa fila, uma por vez, então a limpeza não atinge dados de outra execução em andamento. Em repositório público, o GitHub desliga agendamentos após 60 dias sem atividade.

## Decisões

- **Sem reset de dados no staging.** O Mundo QA tem uma API de testes, mas ela existe só no ambiente descartável (`ENABLE_TEST_API`). No staging, cada teste cria o que precisa com identificadores únicos, e isso permite rodar em paralelo.
- **Contas de teste ficam no ambiente.** Não há API para apagá-las, então todas levam o prefixo `E2E` e a limpeza é feita direto no banco (veja abaixo).
- **`data-id` em vez de texto ou CSS.** Os testes não quebram quando o texto, a tradução ou o estilo mudam.

## Licença

MIT.
