import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function listModels() {
  try {
    const res = await client.models.list();
    console.log("Response:", JSON.stringify(res, null, 2));
    if (Array.isArray(res)) {
      for (const m of res) {
        console.log(`- ${m.name}`);
      }
    }
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

listModels();
