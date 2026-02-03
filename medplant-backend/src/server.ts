import 'dotenv/config';

import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import sharp from 'sharp';
import PDFDocument from 'pdfkit';
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

  // --------------------------------------------------
  // ✅ CORS (REQUIRED FOR WEB)
  // --------------------------------------------------
  app.register(cors, {
    origin: true,
  });


  // --------------------------------------------------
  // Multipart plugin
  // --------------------------------------------------
  app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB
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
        request.log.warn('Identify: Request is not multipart');
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

      const allowed = new Set([
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/octet-stream', // allow for PowerShell / local testing
      ]);

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
            60000
          )
        ),
      ]);

      return reply.send({
        success: true,
        data: { identified },
      });
    } catch (err: any) {
      request.log.error({ err }, 'Identify: Error caught');

      let statusCode = 500;
      let userMessage = 'Failed to identify plant';

      // Detect Gemini Quota/Rate Limit
      if (err?.status === 429 || err?.message?.includes('429')) {
        statusCode = 429;
        userMessage = 'Gemini API limit reached. Please wait 30-60 seconds and try again.';
      } else if (err?.status === 404 || err?.message?.includes('404')) {
        userMessage = 'Plant identification model temporarily unavailable.';
      }

      return error(statusCode, userMessage, {
        name: err?.name,
        message: err?.message,
      });
    }
  });

  // --------------------------------------------------
  // POST /generate-pdf
  // --------------------------------------------------
  app.post('/generate-pdf', async (request, reply) => {
    try {
      const { reportText, plantName } = request.body as { reportText: string; plantName: string };

      if (!reportText || !plantName) {
        return reply.code(400).send({ success: false, error: 'Missing reportText or plantName' });
      }

      const doc = new PDFDocument();

      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="${plantName.replace(/\s+/g, '_')}_Report.pdf"`);

      // Pipe the document directly to the response
      // Pipe the document directly to the response
      doc.pipe(reply.raw);

      // Add content to PDF
      doc.fontSize(20).text(plantName, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(reportText, {
        align: 'justify',
        columns: 1
      });

      doc.end();

      return reply;

    } catch (err) {
      request.log.error({ err }, 'PDF Generation failed');
      return reply.code(500).send({ success: false, error: 'PDF Generation failed' });
    }
  });

  return app;
}
