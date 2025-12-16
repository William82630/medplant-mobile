import Fastify from 'fastify';
import multipart from '@fastify/multipart';

export function buildServer() {
  const app = Fastify({ logger: true });

  // Plugins
  app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB max
    },
  });

  // Existing endpoints
  app.get('/health', async () => {
    return { status: 'ok' };
  });

  app.get('/', async () => {
    return { hello: 'world' };
  });

  // New endpoint: POST /identify (multipart/form-data with image upload)
  app.post('/identify', async (request, reply) => {
    try {
      // Ensure the request is multipart before attempting to read a file
      if (typeof (request as any).isMultipart === 'function' && !(request as any).isMultipart()) {
        return reply.code(400).send({ error: 'Request must be multipart/form-data' });
      }

      const file = await (request as any).file().catch(() => undefined);

      if (!file) {
        return reply.code(400).send({ error: 'No file uploaded. Expecting field name like "image".' });
      }

      // Validate MIME type (allow common image types)
      const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
      if (!allowed.has(file.mimetype)) {
        return reply.code(415).send({ error: `Unsupported media type: ${file.mimetype}` });
      }

      // Drain the stream to avoid hanging connections; we are not storing the file.
      // This keeps the implementation simple and avoids I/O.
      file.file.resume();

      const mockResponse = {
        filename: file.filename,
        mimetype: file.mimetype,
        identified: {
          species: 'Aloe vera',
          confidence: 0.92,
          commonNames: ['Aloe', 'Ghritkumari'],
          medicinalUses: [
            'Soothing skin irritations and burns',
            'Moisturizing and anti-inflammatory properties',
            'Digestive support in some traditional uses'
          ],
          cautions: 'For ingestion, consult a professional; some parts may cause gastrointestinal upset.',
          source: 'mock',
        },
      };

      return reply.code(200).send(mockResponse);
    } catch (err) {
      request.log.error({ err }, 'Failed to process /identify');
      return reply.code(500).send({ error: 'Failed to process upload' });
    }
  });

  return app;
}
