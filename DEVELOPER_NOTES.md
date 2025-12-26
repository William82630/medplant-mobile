# Internal Developer Notes - MedPlant Platform

## Current State (What Works)

- **ResultScreen Scroll**: The plant report screen supports full vertical scrolling to view todas sections including Medicinal Uses, Compounds, Side Effects, and Habitat.
- **Scan Again Button Flow**: A "Scan Again" button is available at the bottom of the report. Tapping it clears the current result data and navigates the user back to the Identification/Camera screen.

## Known Limitations

- **Gemini Rate Limits**: The integrated Gemini AI may encounter rate limits during frequent requests.
- **Vision Quota Constraints**: There are constraints on the vision API quota which may impact image processing frequency.

## Developer Startup Order

To ensure the local environment works correctly, follow this startup sequence:

1. **Backend First**: Start the Fastify backend server (e.g., `npm run dev` in `medplant-backend`).
2. **Emulator Ready**: Ensure the Android emulator is fully booted and recognized by `adb`.
3. **Expo Last**: Start the Expo Metro bundler and launch the app (e.g., `npm run android` in `mobile-app`).

## Home Screen UX

- **Role**: The Home Screen serves as the professional, static entry point of the app, providing a trustworthy "medical-grade" feel.
- **Features**: 
  - Quick access to "Scan a Plant".
  - Feature highlights (Accurate ID, Medicinal Uses, Research References).
  - Mandatory educational disclaimer.
- **Intentional Limitations**: 
  - Static only.
  - No AI calls or backend logic on this screen.
  - No monetization or complex navigation.

> [!TIP]
> **Retry Logic**: If you encounter a `429 Too Many Requests` error from the API, please wait at least **30 seconds** before retrying the identification process.
