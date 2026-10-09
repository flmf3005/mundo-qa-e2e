/**
 * Sonda do limite de cadastro da API: descobre se a chave do limite é estável por cliente.
 *
 * Envia requisições com corpo vazio para POST /api/auth/register, em ritmo constante. A validação recusa com 400,
 * então NADA é criado no ambiente, mas o limitador conta cada requisição antes da validação.
 *
 * Como ler: com a chave sendo o IP real do cliente, as primeiras 5 passam (400) e TODAS as seguintes, dentro do
 * minuto, voltam 429. Se continuarem aparecendo 400 depois do primeiro 429, ou se passarem mais de 5 antes dele,
 * a chave varia entre requisições (o app não está enxergando o IP real, ex.: `trust proxy` com saltos a menos).
 *
 * Uso (espere 1 minuto entre duas execuções, para os contadores zerarem):
 *   npm run probe:throttle
 *   npm run probe:throttle -- --requests=30 --interval=300 --url=https://outro-ambiente
 */
const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    return [key ?? '', value ?? 'true'] as const;
  }),
);

const baseUrl = args.get('url') ?? process.env.BASE_URL ?? 'https://mundoqa-staging.onrender.com';
const requests = Number(args.get('requests') ?? '24');
const intervalMs = Number(args.get('interval') ?? '500');
const LIMIT = 5; // limite documentado do cadastro: 5 por minuto por IP

async function main() {
  const url = new URL('/api/auth/register', baseUrl).toString();
  console.log(`Sonda em ${url}: ${requests} requisições, 1 a cada ${intervalMs} ms (corpo vazio, nada é criado)\n`);

  const statuses: number[] = [];
  for (let i = 1; i <= requests; i++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(20_000),
    });
    statuses.push(res.status);
    const retryAfter = res.headers.get('retry-after');
    console.log(`${String(i).padStart(2, '0')}  ${res.status}${retryAfter ? `  retry-after=${retryAfter}s` : ''}`);
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  const first429 = statuses.indexOf(429);
  if (first429 === -1) {
    console.log(`\nNenhum 429 em ${requests} requisições: aumente --requests ou verifique se o limite está ativo.`);
    return;
  }
  const passedBefore = first429;
  const passedAfter = statuses.slice(first429 + 1).filter((s) => s !== 429).length;

  console.log(`\nPassaram antes do primeiro 429: ${passedBefore} (esperado: ${LIMIT} com chave estável)`);
  console.log(`Passaram depois do primeiro 429: ${passedAfter} (esperado: 0 com chave estável)`);
  if (passedBefore <= LIMIT && passedAfter === 0) {
    console.log('\nConclusão: consistente com um limite por IP estável.');
  } else {
    console.log(
      '\nConclusão: a chave do limite VARIA entre requisições do mesmo cliente. O app provavelmente não vê o IP real ' +
        '(confira o `trust proxy` e quantos proxies há na frente do Node).',
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error((error as Error).message);
  process.exit(1);
});
