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



## Changelog

### [Unreleased] – Identify endpoint improvements

- Standardized JSON response schema for `POST /identify`
  - Success: `{ success: true, data: { file, image, thumbnail, identified } }`
  - Error: `{ success: false, error: { code, message, details? } }`
- Stronger validation
  - Requires `multipart/form-data` and field name `image`
  - Validates MIME types (`image/jpeg`, `image/png`, `image/webp`)
  - Enforces 5 MB size limit (aligned with server multipart limits)
- Real image processing with `sharp`
  - Extracts `format`, `width`, `height` from uploaded image
  - Generates a 64px PNG thumbnail returned as base64
  - Graceful fallback when `sharp` is unavailable
- Tests updated to match the new response format and behavior

**Breaking change**
- `POST /identify` response shape is now standardized. Clients must read from
  `success/data` on success and `success/error` on failure.


  ## Repositories

- **medplant-mobile**: Backend API service (used by both web and mobile clients)
- **medplant-web**: React web frontend that consumes this API

