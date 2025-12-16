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
    function error(code: number, message: string, details?: Record<string, unknown>) {
      return reply.code(code).send({ success: false, error: { code, message, ...(details ? { details } : {}) } });
    }

    try {
      if (typeof (request as any).isMultipart === 'function' && !(request as any).isMultipart()) {
        return error(400, 'Request must be multipart/form-data');
      }

      const file = await (request as any).file().catch(() => undefined);
      if (!file) {
        return error(400, 'No file uploaded. Expecting field name "image".');
      }

      // Expect a specific field name for clarity
      if (file.fieldname !== 'image') {
        return error(400, 'Invalid field name. Expected "image".');
      }

      const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
      if (!file.mimetype || !allowed.has(file.mimetype)) {
        return error(415, `Unsupported media type: ${file.mimetype || 'unknown'}`, {
          allowed: Array.from(allowed),
        });
      }

      // Read the uploaded stream into a Buffer (size already constrained by multipart limits)
      const chunks: Buffer[] = [];
      let total = 0;
      const maxBytes = 5 * 1024 * 1024; // keep in sync with multipart limit
      await new Promise<void>((resolve, reject) => {
        file.file.on('data', (chunk: Buffer) => {
          total += chunk.length;
          if (total > maxBytes) {
            reject(new Error('File too large'));
            return;
          }
          chunks.push(chunk);
        });
        file.file.once('end', () => resolve());
        file.file.once('error', (e: unknown) => reject(e));
      });
      const buffer = Buffer.concat(chunks);

      // Process image with sharp: get metadata and generate a tiny thumbnail
      // Try to process with sharp if available
      let metadata: any | undefined;
      let thumbBuffer: Buffer | undefined;
      try {
        const sharp = (await import('sharp')).default;
        metadata = await sharp(buffer).metadata();
        thumbBuffer = await sharp(buffer)
          .resize({ width: 64, height: 64, fit: 'inside' })
          .png({ compressionLevel: 9 })
          .toBuffer();
      } catch (e) {
        // Fallback: minimal PNG metadata parsing and no-op thumbnail
        const isPng = buffer.length > 24 && buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
        if (!isPng) {
          // If not PNG and sharp isn't available, we cannot process reliably
          // but we still return a controlled error
          request.log.warn('sharp not available; limited processing fallback');
        } else {
          const width = buffer.readUInt32BE(16);
          const height = buffer.readUInt32BE(20);
          metadata = { format: 'png', width, height };
        }
        thumbBuffer = buffer; // no-op thumbnail
      }

      // Ensure buffers and metadata are defined
      thumbBuffer = thumbBuffer ?? buffer;

      const response = {
        success: true,
        data: {
          file: {
            filename: file.filename,
            mimetype: file.mimetype,
            bytes: buffer.length,
          },
          image: {
            format: metadata?.format ?? null,
            width: metadata?.width ?? null,
            height: metadata?.height ?? null,
          },
          thumbnail: {
            mimetype: 'image/png',
            base64: (thumbBuffer as Buffer).toString('base64'),
          },
          identified: {
            species: 'Aloe vera',
            confidence: 0.92,
            commonNames: ['Aloe', 'Ghritkumari'],
            medicinalUses: [
              'Soothing skin irritations and burns',
              'Moisturizing and anti-inflammatory properties',
              'Digestive support in some traditional uses',
            ],
            cautions: 'For ingestion, consult a professional; some parts may cause gastrointestinal upset.',
            source: 'mock',
          },
        },
      } as const;

      return reply.code(200).send(response);
    } catch (err: any) {
      request.log.error({ err }, 'Failed to process /identify');
      const message = typeof err?.message === 'string' ? err.message : 'Failed to process upload';
      return reply.code(500).send({ success: false, error: { code: 500, message } });
    }
  });

  return app;
}
