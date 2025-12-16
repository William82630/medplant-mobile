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

## Usage

### Identify a plant from an image

Upload an image (field name: `image`) as `multipart/form-data`:

```bash
curl -X POST http://localhost:3000/identify \
  -H "Accept: application/json" \
  -F "image=@./path/to/photo.jpg"
```

Supported MIME types: `image/jpeg`, `image/png`, `image/webp`
Max size: 5 MB

### Example success response (compact)

```json
{
  "success": true,
  "data": {
    "file": { "filename": "photo.jpg", "mimetype": "image/jpeg", "bytes": 123456 },
    "image": { "format": "jpeg", "width": 1920, "height": 1080 },
    "thumbnail": { "mimetype": "image/png", "base64": "<base64-bytes>" },
    "identified": {
      "species": "Aloe vera",
      "confidence": 0.92,
      "commonNames": ["Aloe", "Ghritkumari"],
      "medicinalUses": [
        "Soothing skin irritations and burns",
        "Moisturizing and anti-inflammatory properties"
      ],
      "cautions": "For ingestion, consult a professional; some parts may cause gastrointestinal upset.",
      "source": "mock"
    }
  }
}
```

Note: `image.format`, `image.width`, `image.height` may be `null` in rare fallback scenarios.

### Example error response (compact)

Missing file (400):
```json
{
  "success": false,
  "error": { "code": 400, "message": "No file uploaded. Expecting field name \"image\"." }
}
```

Unsupported media type (415):
```json
{
  "success": false,
  "error": {
    "code": 415,
    "message": "Unsupported media type: image/gif",
    "details": { "allowed": ["image/jpeg", "image/png", "image/webp"] }
  }
}
```

### Quick test with tiny PNG (no local file)

Use a 1x1 PNG piped to curl (no file needed):

```bash
base64 -d <<< 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/azk6d8AAAAASUVORK5CYII=' \
  | curl -X POST http://localhost:3000/identify \
      -H "Accept: application/json" \
      -F "image=@-;filename=sample.png;type=image/png"
```

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
