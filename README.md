# Fastify + TypeScript API

A minimal Fastify HTTP API written in TypeScript, including linting, formatting, and tests.

## Getting Started

Prerequisites:
- Node.js 18+
- npm (or your preferred package manager)

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Start the dev server:

```bash
npm run dev
```

The server listens on http://localhost:3000 by default.

## Endpoints
- `GET /` -> `{ "hello": "world" }`
- `GET /health` -> `{ "status": "ok" }`

## Linting & Formatting

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:fix
```

## Build

```bash
npm run build
npm start
```

## Project Structure
- `src/index.ts`: App entrypoint and bootstrap
- `src/server.ts`: Fastify server setup and routes
- `src/__tests__/`: Jest test suite

## Creating a Pull Request
1. Add your remote and push the branch:
   ```bash
   git remote add origin <REMOTE_URL>
   git push -u origin chore/project-scaffold
   ```
2. Create a PR on GitHub with base `main` and head `chore/project-scaffold`.

## License
MIT
