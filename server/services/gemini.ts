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

export interface SimultaneousTryOnRequest {
  modelImageBase64: string;
  fashionImagesBase64: string[];
}

export interface SimultaneousTryOnResponse {
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

    const prompt = `Show the person from the first image wearing/using the fashion item from the second image.

Instructions:
- Make the clothing fit naturally with proper shadows and lighting
- PRESERVE the model's face exactly - same person, same facial features, same identity
- Keep the model's face completely unchanged - only body pose may vary
- Ensure the original body proportions are preserved
- COMPLETELY REMOVE and replace any original clothing that conflicts with the new item - do not layer on top
- If adding a dress, remove the original dress/top completely and show only the new dress
- If adding a top, remove the original top completely and show only the new top
- Create realistic fabric draping and movement
- Maintain professional studio lighting
- Use a plain studio background (off-white, light gray, soft blue, or marble texture)
- Vary the pose naturally - try different angles like slight turns, hand positions, or confident stances
- The result should look like a high-quality fashion photograph taken in a professional studio`;

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

export async function generateSimultaneousTryOn({
  modelImageBase64,
  fashionImagesBase64
}: SimultaneousTryOnRequest): Promise<SimultaneousTryOnResponse> {
  try {
    // Test API key first
    try {
      const testResponse = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: ["Hello, are you working?"],
      });
      console.log("API key test successful for simultaneous try-on");
    } catch (testError) {
      console.error("API key test failed:", testError);
      return {
        success: false,
        error: `API key test failed: ${testError instanceof Error ? testError.message : "Unknown error"}`,
        resultImageBase64: ""
      };
    }

    const prompt = `Create a professional fashion photograph showing the person from the first image wearing all the clothing items from the additional images provided. Apply all fashion items simultaneously to create a complete, cohesive outfit.

CRITICAL REQUIREMENTS:
- PRESERVE the model's face exactly - same person, same facial features, same identity
- Keep the model's face completely unchanged - only body pose may vary slightly
- Ensure the original body proportions are preserved
- COMPLETELY REMOVE and replace any original clothing that conflicts with the new items - do not layer on top
- Apply all provided fashion items together to create one complete outfit
- If multiple items conflict (e.g., multiple tops), intelligently choose the most appropriate combination or blend them cohesively

PROFESSIONAL QUALITY STANDARDS:
- Create realistic fabric draping with proper weight and movement
- Ensure natural fabric textures and material properties
- Add appropriate shadows and highlights for dimensional depth
- Perfect fit and proportions for the model's body type
- Seamless integration of all clothing elements
- Natural wrinkles and fabric behavior
- Proper layering when appropriate (jacket over shirt, etc.)

LIGHTING & STUDIO SETUP:
- Professional studio lighting with key light, fill light, and rim lighting
- Soft, even illumination that eliminates harsh shadows
- Maintain consistent lighting across all clothing items
- Add subtle catch lights and highlights to enhance fabric textures
- Professional color grading and contrast

BACKGROUND & COMPOSITION:
- Use a clean studio background: off-white, light gray, soft blue, or elegant marble texture
- Ensure background complements the outfit without distraction
- Professional fashion photography composition
- Maintain focus on the model and clothing

POSE & PRESENTATION:
- Vary the pose naturally while preserving facial features
- Try confident fashion poses: slight turns, hand positions, or dynamic stances
- Ensure the pose showcases the complete outfit effectively
- Keep the model's identity and facial structure identical to the original
- Natural, confident expression appropriate for fashion photography

The final result should look like a high-end fashion magazine photograph taken in a professional studio setting.`;

    // Build the parts array with model image first, then all fashion images
    const parts = [
      { text: prompt },
      {
        inlineData: {
          data: modelImageBase64,
          mimeType: "image/jpeg",
        },
      }
    ];

    // Add all fashion images
    fashionImagesBase64.forEach(fashionImageBase64 => {
      parts.push({
        inlineData: {
          data: fashionImageBase64,
          mimeType: "image/jpeg",
        },
      });
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: [{
        parts
      }],
      generationConfig: {
        temperature: 0.3, // Slightly lower for more consistent results
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
    console.log("Simultaneous try-on response structure:", JSON.stringify(response, null, 2));
    console.log("Candidates:", JSON.stringify(candidates, null, 2));
    console.log("Content parts:", JSON.stringify(content.parts, null, 2));

    return {
      success: false,
      error: "No image data found in response. This might be due to content moderation or the AI model being unable to process the image combination. Try with different images or reduce the number of fashion items.",
      resultImageBase64: ""
    };

  } catch (error) {
    console.error("Error generating simultaneous virtual try-on:", error);
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
