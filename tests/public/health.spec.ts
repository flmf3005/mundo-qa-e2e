import { expect, test } from '@playwright/test';

test.describe('API: saúde do ambiente', () => {
  test('GET /api/health informa que a API está de pé', { tag: '@smoke' }, async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ status: 'ok' });
  });

  test('GET /api/ready confirma que as dependências (banco) estão prontas', { tag: '@smoke' }, async ({ request }) => {
    const res = await request.get('/api/ready');
    expect(res.status()).toBe(200);
  });
});
