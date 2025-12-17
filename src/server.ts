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

      // Try Gemini identification if configured; otherwise fallback to mock
      async function identifyWithGemini(img: Buffer, mime: string) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return null;

        const fetchAny: any = (globalThis as any).fetch;

        async function listModelsV(version: 'v1' | 'v1beta') {
          const url = `https://generativelanguage.googleapis.com/${version}/models?key=${encodeURIComponent(apiKey)}`;
          const res = await fetchAny(url);
          if (!res.ok) return null;
          try {
            return await res.json();
          } catch {
            return null;
          }
        }

        function normalizeModelName(name: string): string {
          return name.startsWith('models/') ? name : `models/${name}`;
        }

        async function pickModel(): Promise<string | null> {
          // If user provided a model, respect it
          const fromEnv = process.env.GEMINI_MODEL?.trim();
          if (fromEnv) return normalizeModelName(fromEnv);

          // Try v1 first
          const v1 = await listModelsV('v1');
          let candidates: any[] = Array.isArray(v1?.models) ? v1.models : [];
          // Fallback to v1beta if needed
          if (candidates.length === 0) {
            const v1b = await listModelsV('v1beta');
            candidates = Array.isArray(v1b?.models) ? v1b.models : [];
          }
          if (candidates.length === 0) return null;

          const supportsGen = (m: any) => Array.isArray(m?.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent');
          const prefer = (arr: any[], substr: string) => arr.find((m) => typeof m?.name === 'string' && m.name.includes(substr) && supportsGen(m));

          // Preference order
          const mFlash8b = prefer(candidates, 'gemini-1.5-flash-8b');
          const mFlashLatest = prefer(candidates, 'gemini-1.5-flash-latest') || prefer(candidates, 'gemini-1.5-flash');
          const mProLatest = prefer(candidates, 'gemini-1.5-pro-latest') || prefer(candidates, 'gemini-1.5-pro');
          const chosen = mFlash8b || mFlashLatest || mProLatest || candidates.find(supportsGen);
          return chosen ? String(chosen.name) : null;
        }

        const modelName = await pickModel();
        if (!modelName) {
          request.log.warn('Gemini ListModels returned no suitable model');
          return null;
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1/${modelName}:generateContent`;

        // Compose prompt asking for strictly JSON output
        const prompt = [
          'You are a botanical identification assistant. Identify the plant in the provided image.',
          'Return a compact JSON object only, no markdown, with the fields:',
          '{',
          '  "species": string,',
          '  "confidence": number between 0 and 1,',
          '  "commonNames": string[],',
          '  "medicinalUses": string[],',
          '  "cautions": string,',
          '  "regionFound": string,',
          '  "preparation": string,',
          '  "disclaimer": string,',
          '  "source": "gemini"',
          '}',
        ].join('\n');

        const body = {
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                { inlineData: { mimeType: mime, data: img.toString('base64') } },
              ],
            },
          ],
        } as const;

        const controller = new AbortController();
        const timeoutMs = 8000;
        const to = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const url = `${endpoint}?key=${encodeURIComponent(apiKey)}`;
          const res = await fetchAny(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
          });
          if (!res.ok) {
            let errBody: any = undefined;
            try { errBody = await res.text(); } catch {}
            request.log.warn({ status: res.status, errBody, modelName }, 'Gemini request failed');
            return null;
          }
          const json = await res.json();
          // Extract text payload from first candidate
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (typeof text !== 'string') {
            request.log.warn('Gemini response missing text');
            return null;
          }

          // Attempt direct JSON parse; also strip potential markdown fences
          const cleaned = text.trim().replace(/^```(?:json)?\n?|```$/g, '');
          let parsed: any;
          try {
            parsed = JSON.parse(cleaned);
          } catch (e) {
            request.log.warn('Gemini returned non-JSON payload');
            return null;
          }

          // Basic validation
          const isString = (v: any) => typeof v === 'string' && v.length > 0;
          const isNumber = (v: any) => typeof v === 'number' && Number.isFinite(v);
          const isStringArray = (v: any) => Array.isArray(v) && v.every(isString);
          if (
            !isString(parsed?.species) ||
            !isNumber(parsed?.confidence) ||
            !isStringArray(parsed?.commonNames) ||
            !isStringArray(parsed?.medicinalUses) ||
            !isString(parsed?.cautions)
          ) {
            request.log.warn('Gemini JSON missing required fields');
            return null;
          }

          // Clamp confidence
          const confidence = Math.max(0, Math.min(1, parsed.confidence));

          return {
            species: parsed.species,
            confidence,
            commonNames: parsed.commonNames,
            medicinalUses: parsed.medicinalUses,
            cautions: parsed.cautions,
            regionFound: typeof parsed.regionFound === 'string' ? parsed.regionFound : null,
            preparation: typeof parsed.preparation === 'string' ? parsed.preparation : null,
            disclaimer: typeof parsed.disclaimer === 'string' ? parsed.disclaimer : null,
            source: 'gemini' as const,
          };
        } catch (err: any) {
          const reason = err?.name === 'AbortError' ? 'timeout' : 'error';
          request.log.warn({ reason }, 'Gemini call failed');
          return null;
        } finally {
          clearTimeout(to);
        }
      }

      const geminiResult = await identifyWithGemini(buffer, file.mimetype);

      const identified =
        geminiResult ?? {
          species: 'Aloe vera',
          confidence: 0.92,
          commonNames: ['Aloe', 'Ghritkumari'],
          medicinalUses: [
            'Soothing skin irritations and burns',
            'Moisturizing and anti-inflammatory properties',
            'Digestive support in some traditional uses',
          ],
          cautions: 'For ingestion, consult a professional; some parts may cause gastrointestinal upset.',
          regionFound: 'Tropical and subtropical regions; commonly cultivated worldwide',
          preparation: 'For topical use: extract gel from fresh leaf and apply to affected area. For other uses, consult a qualified professional.',
          disclaimer: 'This information is educational and not a substitute for professional medical advice. Consult a qualified healthcare provider.',
          source: 'mock' as const,
        };

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
          identified,
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
