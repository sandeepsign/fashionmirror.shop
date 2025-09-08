import { GoogleGenAI } from "@google/genai";
import { imageBufferToBase64 } from "./gemini";

export interface ImageAnalysisResult {
  name: string;
  category: string;
  description?: string;
}

export async function analyzeImageWithAI(imageBuffer: Buffer): Promise<ImageAnalysisResult> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("Google API key not found");
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const base64Image = imageBufferToBase64(imageBuffer);

    const prompt = `
Analyze this fashion item image and provide:
1. A concise, descriptive name for the item (2-4 words)
2. The category from this list: Dress, Top, Bottom, Footwear, Accessories, Formal, Casual, Activewear, Outerwear

Please respond in this exact JSON format:
{
  "name": "Red Evening Gown",
  "category": "Dress"
}

Focus on:
- Main item type (dress, shirt, shoes, etc.)
- Key characteristics (color, style, formality)
- Keep names concise but descriptive
`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            },
            { text: prompt }
          ]
        }
      ]
    });

    const text = result.response.text();
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in AI response");
    }

    const analysis = JSON.parse(jsonMatch[0]) as ImageAnalysisResult;
    
    // Validate required fields
    if (!analysis.name || !analysis.category) {
      throw new Error("AI response missing required fields");
    }

    return {
      name: analysis.name.trim(),
      category: analysis.category.trim(),
      description: `AI-generated fashion item: ${analysis.name}`
    };

  } catch (error) {
    console.error("Error analyzing image with AI:", error);
    
    // Fallback response
    return {
      name: "Fashion Item",
      category: "Accessories",
      description: "Uploaded fashion item"
    };
  }
}