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
  model: string;
  endpoint?: string;
  timeoutMs?: number;
  maxRetries?: number;
  temperature?: number;
}

export interface GeminiClient {
  identify(imageBuffer: Buffer, opts?: Partial<GeminiClientOptions>): Promise<GeminiIdentifyResult>;
}

/**
 * TODO(Gemini Integration):
 * - Implement GeminiClient.identify() to call Gemini Vision with the provided image buffer.
 * - Use environment-configured endpoint/model/timeout/retries.
 * - Enforce strict JSON-only response from the model; parse and validate into GeminiIdentifyResult.
 * - On any error (timeout, 4xx/5xx, malformed JSON), throw a typed error for the caller to handle.
 * - Do not log sensitive content; redact API keys and avoid logging image data.
 */
export const geminiClient: GeminiClient = {
  async identify(_imageBuffer: Buffer, _opts?: Partial<GeminiClientOptions>): Promise<GeminiIdentifyResult> {
    // Stub: no implementation yet
    throw new Error('Gemini client not implemented');
  },
};
