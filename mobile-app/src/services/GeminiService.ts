/**
 * GeminiService - Direct Gemini Vision API integration for plant identification
 * Phase 1: Basic integration for end-to-end testing
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
import { BACKEND_URL } from '../config/api'; // Ensure this key exists or use hardcoded/env

// Get API key from environment
const getApiKey = (): string => {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!key) {
    console.error('[GeminiService] EXPO_PUBLIC_GEMINI_API_KEY is missing in .env');
    return '';
  }
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
      detailedInfo?: string;
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
          const base64 = dataUrl.split(',')[1] || '';
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

    // Primary model: gemini-2.5-flash, Fallback: gemini-2.0-flash
    const PRIMARY_MODEL = 'gemini-2.5-flash';
    const FALLBACK_MODEL = 'gemini-2.0-flash';

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
    console.log('[GeminiService] Received raw response (last 100 chars):', text.slice(-100));

    // Parse the JSON response
    let cleanedText = text.trim();
    const startIdx = cleanedText.indexOf('{');
    const endIdx = cleanedText.lastIndexOf('}');

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleanedText = cleanedText.substring(startIdx, endIdx + 1);
    } else {
      // Fallback to previous cleaning logic if {} not found
      cleanedText = cleanedText.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    const identified = JSON.parse(cleanedText);
    console.log('[GeminiService] Successfully parsed plant identification JSON');

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
  "therapeuticProfile": "A 1-2 paragraph overview of the plant's primary therapeutic properties and its role in traditional medicine system.",
  "expandedMedicinalBenefits": [
    { "title": "Benefit 1", "description": "Short explanation." },
    { "title": "Benefit 2", "description": "Short explanation." }
  ],
  "traditionalPreparationAndUsage": [
    { "method": "Decoction", "description": "Brief explanation of preparation. No dosage." },
    { "method": "Paste/Poultice", "description": "Brief preparation..." }
  ],
  "sideEffectsAndSafetyProfile": {
    "generalSideEffects": ["Description of side effect"],
    "contraindications": ["Who should avoid this"],
    "drugInteractions": ["Medication interactions"],
    "allergicReactions": ["Sensitivity info"]
  },
  "detailedExplanation": "A 2-paragraph summary covering historical significance and Ayurvedic context.",
  "trustedReferencesAndBibliography": [
    "https://www.nhp.gov.in/ - National Health Portal of India",
    "https://www.ayush.gov.in/ - Ministry of AYUSH",
    "https://examine.com/ - Evidence-based supplement information",
    "https://www.webmd.com/vitamins/ - WebMD Vitamins & Supplements",
    "https://pubmed.ncbi.nlm.nih.gov/ - PubMed Research Database"
  ]
}

- Return ONLY valid JSON, no markdown code blocks or extra text.`;

/**
 * Generate a comprehensive report for PDF export
 */
export async function generateComprehensiveReport(plantName: string): Promise<any> {
  try {
    // Use the fallback model for text-only generation (cheaper/faster for text expansion)
    // or primary if we want highest quality. Let's use primary for premium feel.
    // Use the model requested by the user
    // Fixed: Removing fallback to 1.5-flash as it is deprecated/unavailable and causing errors.
    const PRIMARY_MODEL = 'gemini-2.5-flash';

    console.log('[GeminiService] Generating comprehensive report for:', plantName, 'using:', PRIMARY_MODEL);

    const model = genAI.getGenerativeModel({ model: PRIMARY_MODEL });

    const prompt = COMPREHENSIVE_REPORT_PROMPT.replace('{PLANT_NAME}', plantName);
    console.log('[GeminiService] Sending prompt to Gemini (Comprehensive)...');

    // 30-second timeout wrapper
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini comprehensive report timed out')), 30000)
    );

    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ]) as any;

    const response = await result.response;
    const text = response.text();
    console.log('[GeminiService] Received raw PDF response length:', text.length);

    // Faster and more robust JSON extraction
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');

    if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
      console.warn('[GeminiService] No JSON found in comprehensive report response');
      return null;
    }

    const cleanedText = text.substring(startIdx, endIdx + 1);
    console.log('[GeminiService] Cleaned JSON fragment length:', cleanedText.length);

    try {
      return JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('[GeminiService] JSON Parse Error in comprehensive report:', parseError);
      console.log('[GeminiService] Failing text fragment:', cleanedText.slice(0, 200) + '...');
      return null;
    }
  } catch (error) {
    console.error('Comprehensive Report Error:', error);
    return null;
  }
}

/**
 * Download PDF report from backend
 */
export const downloadPdfReport = async (plantName: string, reportText: string): Promise<string> => {
  // Use the configured backend URL with fallback to production
  const baseUrl = 'https://medplant-backend-okw2.onrender.com';
  const apiUrl = `${baseUrl}/generate-pdf`;

  console.log('[GeminiService] Downloading PDF from:', apiUrl);

  // Sanitize filename to remove illegal path characters (/ \ : * ? " < > |)
  const sanitizeName = (text: string): string =>
    text.replace(/[\/\\:*?"<>|]/g, '_').replace(/\s+/g, '_');

  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    throw new Error('Cache directory is not available');
  }

  const fileName = `${sanitizeName(plantName)}_Report.pdf`;
  const fileUri = cacheDir + fileName;

  console.log('[GeminiService] Target file path:', fileUri);

  try {
    // Ensure cache directory exists
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plantName, reportText }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Backend PDF failed: ${response.status} ${text}`);
    }

    // Get blob
    const blob = await response.blob();

    // Convert to base64 to save using FileReader
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64data = (reader.result as string).split(',')[1];
          await FileSystem.writeAsStringAsync(fileUri, base64data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          console.log('[GeminiService] PDF saved to:', fileUri);
          resolve(fileUri);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  } catch (error) {
    console.error('PDF Download Error:', error);
    throw error;
  }
};

