// Gemini client skeleton (no implementation)

export interface GeminiIdentifyResult {
  species: string;
  confidence: number; // 0..1
  commonNames: string[];
  medicinalUses: string[];
  cautions: string;
}

export interface GeminiClientOptions {
  apiKey: string;
  model: string; // e.g., 'gemini-2.5-flash'
  endpoint?: string; // base URL; default Google API
  timeoutMs?: number; // default 10000
  maxRetries?: number; // default 2
  temperature?: number; // default 0.2
  mimeType?: string; // optional; default 'image/png'
}

export interface GeminiClient {
  identify(imageBuffer: Buffer, opts: GeminiClientOptions): Promise<GeminiIdentifyResult>;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function coerceStringArray(v: unknown, max = 10): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter((s) => s.length > 0)
    .slice(0, max);
}

function validateResult(raw: any): GeminiIdentifyResult {
  const species = typeof raw?.species === 'string' ? raw.species.trim() : '';
  const confidence = typeof raw?.confidence === 'number' ? Math.max(0, Math.min(1, raw.confidence)) : 0;
  const commonNames = coerceStringArray(raw?.commonNames);
  const medicinalUses = coerceStringArray(raw?.medicinalUses);
  const cautions = typeof raw?.cautions === 'string' ? raw.cautions.trim() : '';
  return {
    species: species || 'Unknown',
    confidence,
    commonNames,
    medicinalUses,
    cautions,
  };
}

function extractTextFromResponse(json: any): string | null {
  // Google Generative Language API typical shape
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === 'string' ? text : null;
}

export const geminiClient: GeminiClient = {
  async identify(imageBuffer: Buffer, opts: GeminiClientOptions): Promise<GeminiIdentifyResult> {
    const apiKey = opts.apiKey;
    if (!apiKey) throw new Error('GEMINI_API_KEY missing');

    const model = opts.model || 'gemini-2.5-flash';
    const endpoint = (opts.endpoint || 'https://generativelanguage.googleapis.com/v1beta/models').replace(/\/$/, '');
    const timeoutMs = opts.timeoutMs ?? 10000;
    const maxRetries = Math.max(0, opts.maxRetries ?? 2);
    const temperature = opts.temperature ?? 0.2;
    const mimeType = opts.mimeType || 'image/png';

    const url = `${endpoint}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const base64 = imageBuffer.toString('base64');

    const prompt = `You are a plant identification assistant. Return STRICT JSON ONLY with keys: 
{
  "species": string,
  "confidence": number (0..1),
  "commonNames": string[],
  "medicinalUses": string[],
  "cautions": string
}
- Do not include any text outside JSON.
- If uncertain, lower confidence and add cautions. No medical advice.`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64 } },
          ],
        },
      ],
      generationConfig: {
        temperature,
      },
    } as const;

    let attempt = 0;
    let lastErr: any;
    while (attempt <= maxRetries) {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(t);

        if (res.status === 429 || res.status >= 500) {
          throw new Error(`Temporary Gemini error: ${res.status}`);
        }
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`Gemini error ${res.status}: ${txt.slice(0, 200)}`);
        }

        const json = await res.json();
        const text = extractTextFromResponse(json);
        if (!text) throw new Error('No text response from Gemini');

        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          throw new Error('Gemini returned non-JSON or malformed JSON');
        }

        const validated = validateResult(parsed);
        return validated;
      } catch (e: any) {
        clearTimeout(t);
        lastErr = e;
        attempt += 1;
        if (attempt > maxRetries) break;
        const backoff = Math.min(1000 * attempt * attempt, 3000);
        await sleep(backoff);
      }
    }
    throw lastErr || new Error('Unknown Gemini error');
  },
};
