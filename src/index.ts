import { buildServer } from './server.js';

const port = Number(process.env.PORT || 3000);

async function main() {
  const app = buildServer();
  try {
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
