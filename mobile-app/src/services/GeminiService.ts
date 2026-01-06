/**
 * GeminiService - Direct Gemini Vision API integration for plant identification
 * Phase 1: Basic integration for end-to-end testing
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

// Get API key - using new key directly to avoid Expo config caching
const getApiKey = (): string => {
  // Using the new key directly (matches app.json)
  const key = 'AIzaSyDNPGVTvgbkTqukDmls7q1LRyg6rhgy628';
  console.log('[GeminiService] Using API key (first 10 chars):', key.substring(0, 10) + '...');
  return key;
};

const GEMINI_API_KEY = getApiKey();

// Initialize the Gemini client (will be used only if key is valid)
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Response type matching ResultScreen schema
export interface GeminiIdentifyResponse {
  success: boolean;
  data?: {
    identified: {
      plant: {
        commonName: string;
        scientificName: string;
        family: string;
        confidence: string;
      };
      medicinalUses: string[];
      activeCompounds: string[];
      sideEffects: string[];
      warnings: string[];
      habitat: {
        distribution: string;
        environment: string;
      };
      references: string[];
    };
  };
  error?: {
    code: number;
    message: string;
  };
}

// Prompt for plant identification - Ayurvedic/Herbal medicine focus
const IDENTIFICATION_PROMPT = `You are a medicinal plant identification expert specializing in Ayurveda, traditional Indian medicine, and natural herbal remedies.

Analyze this image and identify the plant. Return a JSON response with this EXACT structure:
{
  "plant": {
    "commonName": "Common name of the plant",
    "scientificName": "Scientific/Latin name",
    "family": "Plant family",
    "confidence": "High/Medium/Low"
  },
  "medicinalUses": ["Ayurvedic use 1 with context", "Traditional use 2", "Use 3", "Use 4", "Use 5"],
  "activeCompounds": ["Natural compound 1", "Compound 2", "Compound 3"],
  "sideEffects": ["Mild consideration 1", "Mild consideration 2", "Consideration 3"],
  "warnings": [],
  "habitat": {
    "distribution": "Geographic regions (e.g., native to India, found in tropical Asia)",
    "environment": "Preferred growing conditions"
  },
  "detailedInfo": "A comprehensive 4-5 sentence paragraph covering: traditional Ayurvedic uses, how the plant is prepared in folk medicine, its significance in Indian herbal traditions, and general wellness benefits. Focus on the plant's positive therapeutic properties.",
  "references": [
    "https://www.nhp.gov.in/",
    "https://www.ayush.gov.in/",
    "https://indianmedicinalplants.info/"
  ]
}

Important guidelines for HERBAL PLANTS:
- Use SIMPLE, EASY-TO-UNDERSTAND English - avoid complex medical jargon so that people with basic English can understand
- Focus on Ayurvedic and traditional Indian medicine perspective
- Medicinal uses should reference traditional knowledge (Ayurveda, Siddha, folk remedies)
- Side effects should be MILD and limited (maximum 3 points) - these are natural herbs, NOT synthetic drugs
- Use gentle language like "may cause mild discomfort" rather than alarming phrases
- Only mention serious warnings for genuinely toxic plants (like Datura, Oleander)
- Most culinary and common medicinal herbs have minimal side effects - reflect this
- The detailedInfo should highlight therapeutic benefits and traditional wisdom in simple words
- ALWAYS include 3-4 trusted reference links in the references array (use reputable Ayurvedic/herbal databases)
- If you cannot identify the plant, set confidence to "Low" and provide your best guess
- Return ONLY valid JSON, no markdown or extra text.`;

/**
 * Identify a plant from an image using Gemini Vision
 */
export async function identifyPlantWithGemini(imageUri: string): Promise<GeminiIdentifyResponse> {
  console.log('[GeminiService] Starting identification for:', imageUri);
  console.log('[GeminiService] API Key configured:', GEMINI_API_KEY ? 'Yes (length: ' + GEMINI_API_KEY.length + ')' : 'No');

  // Check if API key is configured
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    console.error('[GeminiService] API key not configured');
    return {
      success: false,
      error: {
        code: 401,
        message: 'Gemini API key not configured. Please add your API key to app.json.',
      },
    };
  }

  try {
    let base64Image: string;
    let mimeType: string;

    // Check if running on web or native
    const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';
    console.log('[GeminiService] Platform:', isWeb ? 'Web' : 'Native');

    if (isWeb) {
      // For web: fetch the blob and convert to base64
      console.log('[GeminiService] Fetching image blob for web...');
      const response = await fetch(imageUri);
      const blob = await response.blob();
      mimeType = blob.type || 'image/jpeg';

      // Convert blob to base64
      base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = dataUrl.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      console.log('[GeminiService] Image converted to base64, length:', base64Image.length);
    } else {
      // For native: use expo-file-system
      console.log('[GeminiService] Reading image with expo-file-system...');
      base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      mimeType = imageUri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
      console.log('[GeminiService] Image read, length:', base64Image.length);
    }

    // Primary model: gemini-2.5-flash, Fallback: gemini-2.0-flash-lite
    const PRIMARY_MODEL = 'gemini-2.5-flash';
    const FALLBACK_MODEL = 'gemini-2.0-flash-lite';

    const imageData = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    let result;
    try {
      // Try primary model first
      console.log('[GeminiService] Trying primary model:', PRIMARY_MODEL);
      const model = genAI.getGenerativeModel({ model: PRIMARY_MODEL });
      result = await model.generateContent([IDENTIFICATION_PROMPT, imageData]);
    } catch (primaryError: any) {
      // Check if 503 UNAVAILABLE, then try fallback
      const errorStr = String(primaryError?.message || primaryError);
      if (errorStr.includes('503') || errorStr.includes('UNAVAILABLE')) {
        console.log('[GeminiService] Primary model unavailable, trying fallback:', FALLBACK_MODEL);
        const fallbackModel = genAI.getGenerativeModel({ model: FALLBACK_MODEL });
        result = await fallbackModel.generateContent([IDENTIFICATION_PROMPT, imageData]);
      } else {
        throw primaryError;
      }
    }

    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    // Clean up potential markdown code blocks
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7);
    }
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();

    const identified = JSON.parse(cleanedText);

    return {
      success: true,
      data: {
        identified: {
          plant: identified.plant || {
            commonName: 'Unknown',
            scientificName: 'Unknown',
            family: 'Unknown',
            confidence: 'Low',
          },
          medicinalUses: identified.medicinalUses || [],
          activeCompounds: identified.activeCompounds || [],
          sideEffects: identified.sideEffects || [],
          warnings: identified.warnings || [],
          habitat: identified.habitat || {
            distribution: 'Unknown',
            environment: 'Unknown',
          },
          detailedInfo: identified.detailedInfo || '',
          references: identified.references || [],
        },
      },
    };
  } catch (error: any) {
    console.error('[GeminiService] Error:', error);

    return {
      success: false,
      error: {
        code: 500,
        message: error.message || 'Failed to identify plant with Gemini',
      },
    };
  }
}

// Prompt for PREMIUM COMPREHENSIVE PDF REPORT
const COMPREHENSIVE_REPORT_PROMPT = `You are an expert Ayurvedic practitioner and modern herbalist.
Write a PREMIUM, HIGHLY DETAILED comprehensive report for this medicinal plant.
The identifying plant name is provided: "{PLANT_NAME}".

Return a JSON strictly with this structure (6 DISTINCT SECTIONS):
{
  "plant": {
    "commonName": "Common Name",
    "scientificName": "Scientific Name",
    "family": "Family Name",
    "confidence": "High"
  },
  "therapeuticProfile": "A comprehensive 2-3 paragraph overview of the plant's primary therapeutic properties, its role in traditional medicine systems, and the key health areas it addresses. Include Ayurvedic properties like Rasa (taste), Virya (potency), and Vipaka (post-digestive effect) where applicable. Explain which doshas (Vata/Pitta/Kapha) it balances.",
  "expandedMedicinalBenefits": [
    { "title": "Benefit Name", "description": "Detailed 3-4 sentence explanation of this benefit, including the mechanism of action, how it works in the body, and its traditional use context." },
    { "title": "Benefit Name", "description": "Detailed explanation..." },
    { "title": "Benefit Name", "description": "Detailed explanation..." },
    { "title": "Benefit Name", "description": "Detailed explanation..." }
  ],
  "traditionalPreparationAndUsage": [
    { "method": "Decoction", "description": "Detailed explanation of how this preparation is made, the parts of plant used, and the traditional context of its application. Do NOT include specific dosage amounts." },
    { "method": "Paste/Poultice", "description": "Detailed preparation description..." },
    { "method": "Powder/Churna", "description": "Detailed preparation description..." },
    { "method": "Infusion/Tea", "description": "Detailed preparation description..." }
  ],
  "sideEffectsAndSafetyProfile": {
    "generalSideEffects": ["Detailed description of side effect 1 and when it may occur", "Detailed description of side effect 2"],
    "contraindications": ["Detailed explanation of who should avoid this plant and why (e.g., pregnancy, breastfeeding, specific health conditions)"],
    "drugInteractions": ["Detailed explanation of potential interactions with medications and what to be cautious about"],
    "allergicReactions": ["Information about potential allergic responses and sensitivity considerations"]
  },
  "detailedExplanation": "A comprehensive 3-4 paragraph summary of the plant covering: (1) Its historical significance and origins in ethnomedicine, (2) How it has been used across different cultures and traditional medicine systems like Ayurveda, Siddha, Unani, and folk remedies, (3) General wellness and health benefits in modern context, (4) Its significance in sustainable herbalism and natural healing traditions.",
  "trustedReferencesAndBibliography": [
    "https://www.nhp.gov.in/ - National Health Portal of India",
    "https://www.ayush.gov.in/ - Ministry of AYUSH",
    "https://examine.com/ - Evidence-based supplement information",
    "https://www.webmd.com/vitamins/ - WebMD Vitamins & Supplements",
    "https://pubmed.ncbi.nlm.nih.gov/ - PubMed Research Database"
  ]
}

CRITICAL RULES FOR PDF GENERATION:
1. SECTION 1 - THERAPEUTIC PROFILE: Provide a rich overview of the plant's therapeutic nature. Include Ayurvedic properties (Rasa, Virya, Vipaka, Doshas).
2. SECTION 2 - EXPANDED MEDICINAL BENEFITS: Provide at least 4-6 benefits with detailed 3-4 sentence explanations each. EXPLAIN the mechanism, not just list benefits.
3. SECTION 3 - TRADITIONAL PREPARATION & USAGE: Describe multiple traditional preparation methods with informational content. NO specific dosage amounts.
4. SECTION 4 - SIDE EFFECTS & SAFETY PROFILE: This is a SEPARATE section. Include general side effects, contraindications, drug interactions, and allergic reaction info. Keep balanced (mild vs serious).
5. SECTION 5 - DETAILED EXPLANATION: Provide an ethnomedicinal summary covering history, cross-cultural uses, modern wellness context, and significance in natural healing.
6. SECTION 6 - TRUSTED REFERENCES: Include at least 5 reputable URLs with source names (Ayurvedic databases, PubMed, WHO, trusted herbal sources).
- This is a PREMIUM PDF report. Content must be significantly MORE DETAILED than on-screen summaries.
- Use SIMPLE, accessible English while maintaining professional quality.
- Return ONLY valid JSON, no markdown.`;

/**
 * Generate a comprehensive report for PDF export
 */
export async function generateComprehensiveReport(plantName: string): Promise<any> {
  try {
    // Use the fallback model for text-only generation (cheaper/faster for text expansion)
    // or primary if we want highest quality. Let's use primary for premium feel.
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = COMPREHENSIVE_REPORT_PROMPT.replace('{PLANT_NAME}', plantName);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Comprehensive Report Error:', error);
    return null;
  }
}
