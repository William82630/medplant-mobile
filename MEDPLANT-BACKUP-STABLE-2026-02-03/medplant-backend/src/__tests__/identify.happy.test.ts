import request from 'supertest';
import { buildServer } from '../server';

describe('POST /identify (happy path)', () => {
  const app = buildServer();

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts an image upload and returns processed image and identification data', async () => {
    // 1x1 transparent PNG (valid image) base64
    const b64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/azk6d8AAAAASUVORK5CYII=';
    const tinyPng = Buffer.from(b64, 'base64');

    const res = await request(app.server)
      .post('/identify')
      .attach('image', tinyPng, { filename: 'sample.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    const body = res.body;
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('file');
    expect(body.data.file).toMatchObject({ filename: 'sample.png', mimetype: 'image/png' });
    expect(body.data).toHaveProperty('image');
    expect(typeof body.data.image.width).toBe('number');
    expect(typeof body.data.image.height).toBe('number');
    expect(body.data).toHaveProperty('thumbnail');
    expect(typeof body.data.thumbnail.base64).toBe('string');
    expect(body.data).toHaveProperty('identified');
    expect(body.data.identified).toMatchObject({ species: 'Aloe vera' });
    expect(typeof body.data.identified.confidence).toBe('number');
  });
});
