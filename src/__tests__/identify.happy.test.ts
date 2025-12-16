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

  it('accepts an image upload and returns mock identification data', async () => {
    // Minimal JPEG header bytes to simulate an image file
    const tinyJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

    const res = await request(app.server)
      .post('/identify')
      .attach('image', tinyJpeg, { filename: 'sample.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('filename', 'sample.jpg');
    expect(res.body).toHaveProperty('mimetype', 'image/jpeg');
    expect(res.body).toHaveProperty('identified');
    expect(res.body.identified).toMatchObject({
      species: 'Aloe vera',
    });
    expect(typeof res.body.identified.confidence).toBe('number');
  });
});
