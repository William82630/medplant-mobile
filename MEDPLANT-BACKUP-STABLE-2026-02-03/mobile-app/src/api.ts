import { identifyPlantWithGemini, GeminiIdentifyResponse } from './services/GeminiService';

export type IdentifyResponse = GeminiIdentifyResponse;

/**
 * Identify a plant from an image
 * Phase 1: Uses Gemini Vision API directly
 */
export async function identifyPlant(file: { uri: string; mimeType: string; name: string }): Promise<IdentifyResponse> {
  // Use Gemini Vision for identification
  return identifyPlantWithGemini(file.uri);
}
