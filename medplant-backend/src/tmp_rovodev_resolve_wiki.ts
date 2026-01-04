import https from 'https';

export function resolveWikipediaMediaUrl(pageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(pageUrl);
      if (u.hostname !== 'en.wikipedia.org') return resolve(pageUrl);
      const mediaIdx = u.pathname.indexOf('/media/File:');
      if (mediaIdx === -1) return resolve(pageUrl);
      const filePart = decodeURIComponent(u.pathname.substring(mediaIdx + '/media/File:'.length));
      const api = new URL('https://en.wikipedia.org/w/api.php');
      api.searchParams.set('action', 'query');
      api.searchParams.set('titles', `File:${filePart}`);
      api.searchParams.set('prop', 'imageinfo');
      api.searchParams.set('iiprop', 'url');
      api.searchParams.set('format', 'json');

      https
        .get(api.toString(), (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (d: Buffer) => chunks.push(d));
          res.on('end', () => {
            try {
              const json = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
              const pages = json?.query?.pages || {};
              const firstKey = Object.keys(pages)[0];
              const info = pages[firstKey]?.imageinfo?.[0]?.url;
              if (typeof info === 'string' && info.startsWith('https://upload.wikimedia.org')) {
                resolve(info);
              } else {
                resolve(pageUrl);
              }
            } catch (e) {
              resolve(pageUrl);
            }
          });
          res.on('error', reject);
        })
        .on('error', reject);
    } catch (e) {
      resolve(pageUrl);
    }
  });
}
