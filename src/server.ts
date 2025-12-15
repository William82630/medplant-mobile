import Fastify from 'fastify';

export function buildServer() {
  const app = Fastify({ logger: true });

  app.get('/health', async () => {
    return { status: 'ok' };
  });

  app.get('/', async () => {
    return { hello: 'world' };
  });

  return app;
}
