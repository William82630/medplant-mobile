// Environment config and validation for Gemini integration

export type GeminiEnvConfig = {
  enabled: boolean;
  apiKey: string | undefined;
  model: string;
  endpoint?: string;
  timeoutMs: number;
  maxRetries: number;
  temperature: number;
};

const toBool = (v: string | undefined): boolean => /^(1|true|yes|on)$/i.test(v ?? '');
const toInt = (v: string | undefined, def: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
};
const toFloat = (v: string | undefined, def: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

export function getGeminiConfig(): GeminiEnvConfig {
  return {
    enabled: toBool(process.env.GEMINI_ENABLED),
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    endpoint: process.env.GEMINI_ENDPOINT,
    timeoutMs: toInt(process.env.GEMINI_TIMEOUT_MS, 10000),
    maxRetries: toInt(process.env.GEMINI_MAX_RETRIES, 2),
    temperature: toFloat(process.env.GEMINI_TEMPERATURE, 0.2),
  };
}

/**
 * Logs warnings about invalid or risky configurations. No throws; non-invasive.
 */
export function validateGeminiEnv(log: { warn: (msg: string) => void }) {
  const cfg = getGeminiConfig();
  if (cfg.enabled && !cfg.apiKey) {
    log.warn('GEMINI_ENABLED=true but GEMINI_API_KEY is missing. Falling back to mock will occur.');
  }
  if (cfg.timeoutMs < 1000) {
    log.warn('GEMINI_TIMEOUT_MS is very low; may cause frequent timeouts.');
  }
  if (cfg.maxRetries > 5) {
    log.warn('GEMINI_MAX_RETRIES is high; consider lowering to reduce latency.');
  }
  return cfg;
}
