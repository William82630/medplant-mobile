# AI Agent Instructions for MedPlant Mobile

## Project Overview

**MedPlant** is a full-stack medicinal plant identification system with:
- **Backend**: Fastify + TypeScript API (`src/`) with image processing and Gemini AI integration
- **Mobile Frontend**: React Native (Expo) app (`mobile-app/`) for capturing and analyzing plant images
- **Cross-Platform**: Supports native mobile (iOS/Android) and web

## Architecture & Data Flow

### System Architecture
```
User Device (Web/Mobile)
    ↓ (FormData with image file)
Expo/Fetch API (mobile-app/src/api.ts)
    ↓ (POST /identify)
Fastify Server (src/server.ts)
    ├── Image Validation & Sharp Processing
    ├── Thumbnail Generation (PNG Base64)
    └── Gemini Vision API Call
         ↓ (Gemini 2.5 Flash Lite)
         Returns: Markdown report (species, confidence, uses, cautions)
    ↓
Response (standardized JSON envelope)
    ↓ (stored in AsyncStorage)
Mobile App History (mobile-app/src/history.ts)
```

### Key Integration Points
1. **Image Upload**: `multipart/form-data` with field name `image` (5 MB max)
2. **Supported formats**: `image/jpeg`, `image/png`, `image/webp`
3. **Gemini Model**: `gemini-2.5-flash-lite` with temperature 0.2 for consistent outputs
4. **Response structure**: `{ success: boolean, data?: {...}, error?: {code, message, details} }`

## Project-Specific Patterns

### 1. Standardized Error Handling
- All API responses use envelope pattern: `{ success, data?, error? }`
- HTTP error codes align with response.error.code (400 for missing file, 415 for unsupported type)
- See [src/server.ts](src/server.ts) for error handler implementations

### 2. Environment Configuration
- Backend: `.env` file (GEMINI_API_KEY, GEMINI_MODEL, PORT)
- Mobile: `EXPO_PUBLIC_BACKEND_URL` env var (with `http://localhost:3000` fallback)
- Config validation: [src/config/env.ts](src/config/env.ts) uses type-safe parsers (`toBool`, `toInt`, `toFloat`)

### 3. Mobile-Web Polyfill Pattern
- `identifyPlant()` in [mobile-app/src/api.ts](mobile-app/src/api.ts) accepts union type: `WebIdentifyArgs | MobileIdentifyArgs`
- Web uses native `File`, mobile uses Expo picker `uri` + `type` + `name`
- FormData construction is platform-agnostic

### 4. Persistent History Storage
- AsyncStorage key: `mp_history_v1` (versioned to allow migrations)
- Max 100 entries (auto-capped by prepending latest)
- See [mobile-app/src/history.ts](mobile-app/src/history.ts)

### 5. Markdown-First Responses
- Gemini outputs Markdown reports directly
- Mobile app renders via `react-native-markdown-display`
- Parsed by frontend into structured UI (see [mobile-app/src/MainApp.tsx](mobile-app/src/MainApp.tsx) `buildMarkdown()`)

## Developer Workflows

### Setup & Install
```bash
# Root (backend)
npm install && npm run dev

# Mobile-app
cd mobile-app && npm install && npm start
```

### Testing Backend
```bash
npm test              # Jest (ts-jest preset)
npm run test:watch   # Watch mode
```
Test files: `src/__tests__/**/*.test.ts` (pattern in [jest.config.ts](jest.config.ts))

### Build Backend
```bash
npm run build   # Outputs to dist/
npm start       # Run compiled server
```

### Linting & Formatting
```bash
npm run lint      # ESLint (.ts files)
npm run lint:fix  # Auto-fix
npm run format    # Prettier check
npm run format:fix
```

### Mobile Development
```bash
npm run web        # Web/Expo preview
npm run android    # Build Android
npm run ios        # Build iOS
```

### Debugging Gemini Integration
- Check startup logs in [src/index.ts](src/index.ts): `=== STARTUP DEBUG ===` block
- Validates GEMINI_API_KEY presence at boot (warns if missing)
- Error logs from Gemini calls appear in console (see [src/services/gemini.ts](src/services/gemini.ts))

## Critical Files & Their Roles

| File | Role | Key Points |
|------|------|-----------|
| [src/server.ts](src/server.ts) | Fastify app builder | Multipart plugin, validation, Gemini env check |
| [src/services/gemini.ts](src/services/gemini.ts) | Gemini API client | Image→Base64→Markdown flow |
| [mobile-app/src/api.ts](mobile-app/src/api.ts) | Fetch wrapper | Platform abstraction for FormData |
| [mobile-app/src/history.ts](mobile-app/src/history.ts) | Local persistence | AsyncStorage versioning pattern |
| [mobile-app/src/MainApp.tsx](mobile-app/src/MainApp.tsx) | Primary UI container | Tab nav (identify/history), state management |
| [src/config/env.ts](src/config/env.ts) | Env parsing | Type-safe config builders |

## Commands Quick Reference

```bash
# Backend
npm run dev               # Dev server (tsx watch)
npm test                 # Run tests
npm run lint:fix         # Fix linting issues
npm run build && npm start  # Production build + run

# Mobile
cd mobile-app && npm start  # Start Expo
cd mobile-app && npm run web  # Web preview
```

## Conventions & Gotchas

1. **TypeScript strict mode**: All backend code is strict TS; use proper types (see `IdentifyResponse`, `HistoryItem`)
2. **Image validation on backend**: Size (5 MB) and MIME type checks before processing
3. **Gemini temperature 0.2**: Low temperature ensures consistent, factual plant data—do not change
4. **Markdown for output**: Always expect Gemini to return Markdown; parse server-side, render client-side
5. **No database**: History is client-side only (AsyncStorage); no server-side persistence
