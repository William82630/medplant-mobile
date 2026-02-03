import { buildServer } from '../server';

describe('POST /identify', () => {
  const app = buildServer();

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns standardized error when no file is uploaded', async () => {
    const res = await app.inject({ method: 'POST', url: '/identify' });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body).toMatchObject({ success: false, error: { code: 400 } });
    expect(typeof body.error.message).toBe('string');
  });
});
