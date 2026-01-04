import { GoogleGenAI } from "@google/genai";

// --------------------------------------------------
// Initialize Gemini
// --------------------------------------------------
const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// --------------------------------------------------
// Identify Medicinal Plant (STRUCTURED JSON)
// --------------------------------------------------
export async function identifyPlantWithGemini(
  imageBuffer: Buffer,
  mimeType: string
): Promise<any> {
  const modelName = "gemini-2.5-flash";
  const b64Image = imageBuffer.toString("base64");

  // ---------------- PROMPT (LOCKED CONTRACT) ----------------
  const systemPrompt = `
You are a world-class medicinal botanist and herbal pharmacologist. 
Your goal is to provide helpful, scientific, and detailed medicinal plant reports.

CRITICAL DIRECTIVES:
1. ALWAYS prioritize medicinal benefits. We want to educate the user on the positive properties of the plant first.
2. For well-known plants like Aloe Vera, you MUST provide at least 10 distinct medicinal uses.
3. Use a professional, encyclopedic tone.
4. Return ONLY valid JSON. No markdown backticks, no preamble.
`;

  const userPrompt = `
Identify this plant and generate a "Professional Plant Report".

JSON STRUCTURE REQUIRED:
{
  "plant": {
    "commonName": "string",
    "scientificName": "string",
    "family": "string",
    "confidence": "High | Medium | Low"
  },
  "medicinalUses": ["point 1", "point 2", ...], // Provide 8-12 HIGHLY DETAILED, unique medicinal uses. Each point must be a full, professional sentence (minimum 15-20 words) explaining the specific therapeutic action, traditional preparation, or medical benefit.
  "activeCompounds": ["compound 1", ...], // Key chemicals like Aloin, etc.
  "sideEffects": ["effect 1", ...], // Scientific adverse effects (neutral tone).
  "warnings": ["warning 1", ...], // Precautions (proportionate, not alarmist).
  "habitat": {
    "distribution": "string", // Regions/Countries.
    "environment": "string" // Soil, climate.
  },
  "references": ["WHO Monograph", "NIH PubMed article", ...] // Professional sources.
}

IMAGE ANALYSIS:
Identify the plant in the image. If it is Aloe Vera (common), provide a very rich list of 10+ uses.
Ensure the JSON is perfectly valid.
`;

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: [
        {
          role: "user",
          parts: [
            { text: systemPrompt + "\n" + userPrompt },
            {
              inlineData: {
                mimeType,
                data: b64Image,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0.2,
      },
    });

    const rawText =
      response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Gemini returned empty response");
    }

    // -------- ROBUST JSON CLEANING --------
    let cleanedText = rawText;
    if (rawText.includes("```")) {
      // Strip markdown code blocks (e.g., ```json ... ```)
      cleanedText = rawText.replace(/```(?:json)?\n?([\s\S]*?)\n?```/i, "$1").trim();
    }

    // -------- STRICT JSON PARSE --------
    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (err) {
      console.error("Gemini returned invalid string for parsing:", cleanedText);
      throw new Error("Gemini response was not valid JSON");
    }

    return parsed;
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
}
