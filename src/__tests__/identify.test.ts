import { buildServer } from '../server';

describe('POST /identify', () => {
  const app = buildServer();

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 400 when no file is uploaded', async () => {
    const res = await app.inject({ method: 'POST', url: '/identify' });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toHaveProperty('error');
  });
});
