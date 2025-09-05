import * as fs from "fs";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });

export interface VirtualTryOnRequest {
  modelImageBase64: string;
  fashionImageBase64: string;
  fashionItemName: string;
  fashionCategory: string;
}

export interface VirtualTryOnResponse {
  resultImageBase64: string;
  success: boolean;
  error?: string;
}

export async function generateVirtualTryOn({
  modelImageBase64,
  fashionImageBase64,
  fashionItemName,
  fashionCategory
}: VirtualTryOnRequest): Promise<VirtualTryOnResponse> {
  try {
    // First test if the API key works with a simple text model
    try {
      const testResponse = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: ["Hello, are you working?"],
      });
      console.log("API key test successful");
    } catch (testError) {
      console.error("API key test failed:", testError);
      return {
        success: false,
        error: `API key test failed: ${testError instanceof Error ? testError.message : "Unknown error"}`,
        resultImageBase64: ""
      };
    }

    // Create different prompts for clothing vs accessories
    const isAccessory = fashionCategory.toLowerCase() === 'accessories';
    
    const prompt = isAccessory 
      ? `Show the exact same person from the first image holding or using the ${fashionItemName} from the second image in a natural way. Keep the person's face, body, pose, and background identical. Only add the accessory item. Preserve all other details.`
      : `Show the exact same person from the first image wearing the ${fashionItemName} from the second image. Keep the person's face, body, pose, and background identical. Only change the clothing item. Preserve all other details.`;

    // Try with the correct API structure
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: modelImageBase64,
              mimeType: "image/jpeg",
            },
          },
          {
            inlineData: {
              data: fashionImageBase64,
              mimeType: "image/jpeg",
            },
          }
        ]
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096,
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      return {
        success: false,
        error: "No candidates returned from AI model",
        resultImageBase64: ""
      };
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      return {
        success: false,
        error: "No content parts returned from AI model",
        resultImageBase64: ""
      };
    }

    for (const part of content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return {
          success: true,
          resultImageBase64: part.inlineData.data
        };
      }
    }

    // Log the full response for debugging
    console.log("Response structure:", JSON.stringify(response, null, 2));
    console.log("Candidates:", JSON.stringify(candidates, null, 2));
    console.log("Content parts:", JSON.stringify(content.parts, null, 2));

    return {
      success: false,
      error: "No image data found in response. This might be due to content moderation or the AI model being unable to process the image combination. Try with a different model photo or fashion item.",
      resultImageBase64: ""
    };

  } catch (error) {
    console.error("Error generating virtual try-on:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      resultImageBase64: ""
    };
  }
}

export function imageBufferToBase64(buffer: Buffer, mimeType: string = "image/jpeg"): string {
  return buffer.toString("base64");
}

export function base64ToImageBuffer(base64: string): Buffer {
  return Buffer.from(base64, "base64");
}
