
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateProductDescription(productName: string, category: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a professional, SEO-friendly product description for a product named "${productName}" in the category "${category}". Keep it under 100 words.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });
    return response.text || "Failed to generate description.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating description. Please check your connection.";
  }
}
