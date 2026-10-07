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

Requisitos: Node 20+.

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
  fixtures/      test.extend com user e loggedInPage
  pages/         Page Objects (login, cadastro, painel)
  utils/         geração de dados de teste
  global-setup.ts
tests/
  public/        telas e endpoints sem login
  auth/          cadastro e login
.github/workflows/e2e.yml
```

## Decisões

- **Sem reset de dados no staging.** O Mundo QA tem uma API de testes, mas ela existe só no ambiente descartável (`ENABLE_TEST_API`). No staging, cada teste cria o que precisa com identificadores únicos, e isso permite rodar em paralelo.
- **Contas de teste ficam no ambiente.** Não há API para apagá-las, então todas levam o prefixo `E2E`, que permite limpeza periódica.
- **`data-id` em vez de texto ou CSS.** Os testes não quebram quando o texto, a tradução ou o estilo mudam.

## Licença

MIT.
