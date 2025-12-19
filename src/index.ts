
import 'dotenv/config';
import { buildServer } from './server';


const port = Number(process.env.PORT || 3000);

// Debug: Check if GEMINI_API_KEY is loaded
console.log('=== STARTUP DEBUG ===');
console.log('GEMINI_API_KEY loaded:', process.env.GEMINI_API_KEY ? `✓ (${process.env.GEMINI_API_KEY.length} chars)` : '✗ NOT LOADED');
console.log('PORT:', port);
console.log('=== END STARTUP DEBUG ===');

async function main() {
  const app = buildServer();
  console.log('[MAIN] App built, attempting to listen...');
  
  try {
   console.log(`[MAIN] Listening on http://127.0.0.1:${port}`);
   const address = await app.listen({ port, host: '127.0.0.1' });
    console.log(`[MAIN] Successfully listening at ${address}`);
  } catch (err) {
    console.log('[MAIN] CAUGHT ERROR:');
    app.log.error(err);
    console.error(err);
    process.exit(1);
  }
}

main();
