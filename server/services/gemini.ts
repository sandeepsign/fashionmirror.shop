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

    const prompt = `Create a professional e-commerce fashion photo showing the person from the first image wearing the ${fashionItemName} from the second image. 

Instructions:
- Make the clothing fit naturally with proper shadows and lighting
- Ensure the original face and body proportions are preserved
- Remove any original clothing that conflicts with the new item
- Create realistic fabric draping and movement
- Maintain professional studio lighting
- The result should look like a high-quality fashion photograph

Category: ${fashionCategory}
Item: ${fashionItemName}`;

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

    return {
      success: false,
      error: "No image data found in response",
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
