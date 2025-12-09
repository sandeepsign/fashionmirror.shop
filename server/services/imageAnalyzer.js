import { GoogleGenAI } from "@google/genai";
import { imageBufferToBase64 } from "./gemini";
export async function analyzeImageWithAI(imageBuffer) {
    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new Error("Google API key not found");
        }
        const ai = new GoogleGenAI({ apiKey });
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
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash-image-preview",
            contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                data: base64Image,
                                mimeType: "image/jpeg",
                            },
                        }
                    ]
                }]
        });
        const text = result.text || result.response?.text?.() || result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "Could not parse AI response";
        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No valid JSON found in AI response");
        }
        const analysis = JSON.parse(jsonMatch[0]);
        // Validate required fields
        if (!analysis.name || !analysis.category) {
            throw new Error("AI response missing required fields");
        }
        return {
            name: analysis.name.trim(),
            category: analysis.category.trim(),
            description: `AI-generated fashion item: ${analysis.name}`
        };
    }
    catch (error) {
        console.error("Error analyzing image with AI:", error);
        // Fallback response
        return {
            name: "Fashion Item",
            category: "Accessories",
            description: "Uploaded fashion item"
        };
    }
}
