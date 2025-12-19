import 'dotenv/config';

import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import sharp from 'sharp';
import { identifyPlantWithGemini } from './services/gemini.js';

// --------------------------------------------------
// Validate Gemini environment (safe, non-fatal)
// --------------------------------------------------
function validateGeminiEnv(logger: {
  warn: (msg: string) => void;
  info?: (obj: any, msg?: string) => void;
}) {
  try {
    const { GEMINI_API_KEY, GEMINI_MODEL } = process.env as Record<
      string,
      string | undefined
    >;

    if (!GEMINI_API_KEY) {
      logger.warn('GEMINI_API_KEY is not set; /identify will fail.');
    } else {
      logger.info?.(
        { model: GEMINI_MODEL || 'auto' },
        'Gemini is enabled'
      );
    }
  } catch {
    logger.warn('Failed to read Gemini environment variables');
  }
}

export function buildServer() {
  const app = Fastify({ logger: true });

  // Multipart plugin
  app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB
    },
  });

  // Env check at startup
  validateGeminiEnv({
    warn: (msg: string) => app.log.warn(msg),
    info: (obj: any, msg?: string) =>
      msg ? app.log.info(obj, msg) : app.log.info(obj),
  });

  // Health check
  app.get('/health', async () => ({ status: 'ok' }));
  app.get('/', async () => ({ hello: 'world' }));

  // --------------------------------------------------
  // POST /identify
  // --------------------------------------------------
  app.post('/identify', async (request, reply) => {
    function error(
      code: number,
      message: string,
      details?: Record<string, unknown>
    ) {
      return reply.code(code).send({
        success: false,
        error: { code, message, ...(details ? { details } : {}) },
      });
    }

    try {
      // Ensure multipart
      if (
        typeof (request as any).isMultipart === 'function' &&
        !(request as any).isMultipart()
      ) {
        return error(400, 'Request must be multipart/form-data');
      }

      // Read uploaded file
      const file = await (request as any).file().catch(() => undefined);
      if (!file) {
        return error(400, 'No file uploaded. Expecting field name "image".');
      }

      if (file.fieldname !== 'image') {
        return error(400, 'Invalid field name. Expected "image".');
      }

      const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
      if (!file.mimetype || !allowed.has(file.mimetype)) {
        return error(
          415,
          `Unsupported media type: ${file.mimetype || 'unknown'}`,
          { allowed: Array.from(allowed) }
        );
      }

      const buffer = await file.toBuffer();

      request.log.info(
        {
          filename: file.filename,
          mimetype: file.mimetype,
          bytes: buffer.length,
        },
        'Identify: image received'
      );

      try {
        const meta = await sharp(buffer).metadata();
        request.log.info({ meta }, 'Identify: image metadata');
      } catch (e) {
        request.log.warn({ err: e }, 'Identify: sharp metadata failed');
      }

      // ---- HARD FAIL IF GEMINI NOT CONFIGURED ----
      if (!process.env.GEMINI_API_KEY) {
        request.log.error('GEMINI_API_KEY missing at request time');
        return error(500, 'Server misconfigured: GEMINI_API_KEY missing');
      }

      // ---- GEMINI CALL WITH TIMEOUT ----
      const identified = await Promise.race([
        identifyPlantWithGemini(buffer, file.mimetype),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Gemini request timed out')),
            15000
          )
        ),
      ]);

      return reply.send({
        success: true,
        data: { identified },
      });
    } catch (err: any) {
      request.log.error(
        {
          err,
          stringified: JSON.stringify(
            err,
            Object.getOwnPropertyNames(err),
            2
          ),
        },
        'Identify: unhandled error'
      );

      return error(500, 'Failed to identify plant', {
        name: err?.name,
        message: err?.message,
      });
    }
  });

  return app;
}
