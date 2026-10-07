/**
 * Remove do banco as contas e organizações criadas pelos testes E2E.
 *
 * Não existe API para apagar usuários nem organizações no Mundo QA, então a limpeza é feita direto no
 * PostgreSQL. Por segurança:
 *   - sem `--apply`, só lista o que seria removido (dry-run);
 *   - com `--apply`, exige `--confirm-host=<host do banco>`, para não rodar no banco errado por engano;
 *   - só toca em dados que casam, ao mesmo tempo, com os padrões gerados por `newTestUser()`:
 *       organização "E2E Org <8 hex>" e usuários "e2e-<8 hex>@mundoqa-e2e.test";
 *   - uma organização só entra se TODOS os seus membros forem usuários E2E;
 *   - ignora o que for mais novo que `--older-than` horas (padrão 6), para não apagar uma execução em curso;
 *   - cada organização é removida numa transação (um DELETE em cascata): se falhar, nada dela é apagado.
 *
 * Uso:
 *   DATABASE_URL=postgresql://... npm run cleanup
 *   DATABASE_URL=postgresql://... npm run cleanup -- --apply --confirm-host=<host>
 *   ... --older-than=0      # inclui tudo, mesmo o que acabou de ser criado
 *
 * Limitação: arquivos enviados ao armazenamento S3 (anexos) não são apagados. Os testes atuais não enviam anexos.
 */
import { Client } from 'pg';

const ORG_NAME_RE = '^E2E Org [0-9a-f]{8}$';
const EMAIL_RE = '^e2e-[0-9a-f]{8}@mundoqa-e2e\\.test$';

interface OrgRow {
  id: string;
  name: string;
  createdAt: Date;
  projects: number;
  testCases: number;
  issues: number;
}

interface UserRow {
  id: string;
  email: string;
}

function parseArgs(argv: string[]) {
  const flags = new Map<string, string>();
  for (const arg of argv) {
    if (!arg.startsWith('--')) throw new Error(`Argumento desconhecido: ${arg}`);
    const [key, value] = arg.slice(2).split('=');
    flags.set(key ?? '', value ?? 'true');
  }
  const olderThan = Number(flags.get('older-than') ?? '6');
  if (!Number.isFinite(olderThan) || olderThan < 0) throw new Error('--older-than deve ser um número de horas >= 0');
  return {
    apply: flags.get('apply') === 'true',
    confirmHost: flags.get('confirm-host'),
    olderThan,
  };
}

async function findOrganizations(db: Client, olderThanHours: number): Promise<OrgRow[]> {
  const { rows } = await db.query<OrgRow>(
    // "createdAt" é `timestamp` sem fuso, gravado em UTC; AT TIME ZONE 'UTC' evita que o driver o leia como horário local.
    `SELECT o.id, o.name, o."createdAt" AT TIME ZONE 'UTC' AS "createdAt",
            (SELECT count(*)::int FROM "Project" p WHERE p."organizationId" = o.id) AS projects,
            (SELECT count(*)::int FROM "TestCase" t WHERE t."organizationId" = o.id) AS "testCases",
            (SELECT count(*)::int FROM "Issue" i WHERE i."organizationId" = o.id) AS issues
       FROM "Organization" o
      WHERE o.name ~ $1
        AND o."createdAt" < (now() AT TIME ZONE 'UTC') - $2::numeric * interval '1 hour'
        AND NOT EXISTS (
              SELECT 1 FROM "Membership" m JOIN "User" u ON u.id = m."userId"
               WHERE m."organizationId" = o.id AND u.email !~ $3)
      ORDER BY o."createdAt"`,
    [ORG_NAME_RE, olderThanHours, EMAIL_RE],
  );
  return rows;
}

/** Usuários E2E cujas únicas organizações são as selecionadas (ou que não têm nenhuma). */
async function findUsers(db: Client, olderThanHours: number, orgIds: string[]): Promise<UserRow[]> {
  const { rows } = await db.query<UserRow>(
    `SELECT u.id, u.email
       FROM "User" u
      WHERE u.email ~ $1
        AND u."createdAt" < (now() AT TIME ZONE 'UTC') - $2::numeric * interval '1 hour'
        AND NOT EXISTS (
              SELECT 1 FROM "Membership" m
               WHERE m."userId" = u.id AND NOT (m."organizationId" = ANY($3::text[])))
      ORDER BY u."createdAt"`,
    [EMAIL_RE, olderThanHours, orgIds],
  );
  return rows;
}

/**
 * Uma exclusão só: todas as tabelas do Mundo QA referenciam a organização com `ON DELETE CASCADE`.
 * As relações `Restrict` internas (execução→caso, bug→status, ciclo→plano, pasta→pasta...) não atrapalham,
 * porque o PostgreSQL só as confere ao fim do comando, quando os dois lados já foram removidos.
 * Verificado contra um banco com todos esses vínculos preenchidos.
 */
async function deleteOrganization(db: Client, orgId: string) {
  await db.query('BEGIN');
  try {
    await db.query('DELETE FROM "Organization" WHERE id = $1', [orgId]);
    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

async function deleteUser(db: Client, userId: string) {
  await db.query('BEGIN');
  try {
    await db.query('DELETE FROM "User" WHERE id = $1', [userId]);
    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

async function main() {
  const { apply, confirmHost, olderThan } = parseArgs(process.argv.slice(2));

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Defina DATABASE_URL (a mesma conexão do banco do ambiente a limpar).');
  const host = new URL(connectionString).hostname;

  if (apply && confirmHost !== host) {
    throw new Error(`Para apagar, repita o host do banco: --confirm-host=${host}`);
  }

  const db = new Client({ connectionString });
  await db.connect();
  try {
    const orgs = await findOrganizations(db, olderThan);
    const users = await findUsers(db, olderThan, orgs.map((o) => o.id));

    console.log(`Banco: ${host}`);
    console.log(`Modo: ${apply ? 'APAGAR' : 'dry-run (nada será apagado)'} | mais antigos que ${olderThan}h`);
    console.log(`\nOrganizações E2E: ${orgs.length}`);
    for (const o of orgs) {
      console.log(`  - ${o.name}  criada em ${o.createdAt.toISOString()}  (${o.projects} projeto(s), ${o.testCases} caso(s), ${o.issues} bug(s))`);
    }
    console.log(`Usuários E2E: ${users.length}`);

    if (!apply) {
      console.log('\nNada foi apagado. Para apagar: --apply --confirm-host=' + host);
      return;
    }

    let failures = 0;
    for (const o of orgs) {
      try {
        await deleteOrganization(db, o.id);
        console.log(`OK    organização ${o.name}`);
      } catch (error) {
        failures++;
        console.error(`ERRO  organização ${o.name}: ${(error as Error).message}`);
      }
    }
    // Reavalia: só sobram para apagar os usuários cujas organizações realmente saíram.
    for (const u of await findUsers(db, olderThan, [])) {
      try {
        await deleteUser(db, u.id);
        console.log(`OK    usuário ${u.email}`);
      } catch (error) {
        failures++;
        console.error(`ERRO  usuário ${u.email}: ${(error as Error).message}`);
      }
    }
    console.log(failures ? `\nConcluído com ${failures} erro(s).` : '\nConcluído sem erros.');
    if (failures) process.exitCode = 1;
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error((error as Error).message);
  process.exit(1);
});
