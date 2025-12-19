import { GoogleGenAI } from "@google/genai";

// --------------------------------------------------
// Initialize Gemini
// --------------------------------------------------
const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// --------------------------------------------------
// Identify Medicinal Plant
// --------------------------------------------------
export async function identifyPlantWithGemini(
  imageBuffer: Buffer,
  mimeType: string
): Promise<string> {
  // Google-recommended high-throughput Vision model
  const modelName = "gemini-2.5-flash-lite";

  const b64Image = imageBuffer.toString("base64");

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: [
        {
          role: "user",
          parts: [
            { text: "Identify this medicinal plant and provide a Markdown report." },
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

    const text =
      response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Gemini returned empty response");
    }

    return text;
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
}
