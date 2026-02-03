import request from 'supertest';
import { buildServer } from './src/server.js';
import https from 'https';
import { resolveWikipediaMediaUrl } from './tmp_rovodev_resolve_wiki.js';

function download(url: string): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'curl/8.0 (+https://example.com)', 'Accept': '*/*' } }, (res) => {
      if ((res.statusCode || 0) >= 300 && (res.statusCode || 0) < 400 && res.headers.location) {
        // handle redirects
        return resolve(download(res.headers.location));
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks: Buffer[] = [];
      res.on('data', (d: Buffer) => chunks.push(d));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = (res.headers['content-type'] as string) || 'application/octet-stream';
        const filename = url.split('/').pop() || 'image';
        resolve({ buffer, contentType, filename });
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

(async () => {
  // Resolve Wikipedia media URLs to direct image URLs
  const inputUrl = 'https://en.wikipedia.org/wiki/Guava#/media/File:Guava_ID.jpg';
  const resolved = await resolveWikipediaMediaUrl(inputUrl);
  const { buffer: img, contentType, filename } = await download(resolved);

  const app = buildServer();
  await app.ready();
  try {
    const res = await request(app.server)
      .post('/identify')
      .attach('image', img, { filename, contentType: contentType.includes('image/') ? contentType : 'image/jpeg' });
    console.log(JSON.stringify(res.body, null, 2));
    process.exitCode = res.status;
  } finally {
    await app.close();
  }
})().catch((e) => {
  console.error('Live test failed:', e?.message || e);
  process.exit(1);
});
