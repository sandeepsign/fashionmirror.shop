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

    const prompt = `CRITICAL INSTRUCTION: You must preserve the EXACT SAME PERSON'S FACE from the first image. This is the most important requirement.

FACE PRESERVATION (ABSOLUTELY MANDATORY):
- DO NOT change the person's identity, face, or appearance
- DO NOT alter hair color, eye color, skin tone, or facial features
- DO NOT create a different person or model
- DO NOT change facial structure, nose, mouth, eyes, or jawline
- The person's head, face, and hair must remain completely identical
- Only swap the clothing item - NOTHING ELSE
- This is a clothing swap only - not a person replacement

TASK: Take the clothing item from the second image and place it on the SAME PERSON from the first image.

CLOTHING SWAP INSTRUCTIONS:
- Make the clothing fit naturally with proper shadows and lighting
- COMPLETELY REMOVE and replace any original clothing that conflicts with the new item
- If adding a dress, remove the original dress/top completely and show only the new dress
- If adding a top, remove the original top completely and show only the new top
- Create realistic fabric draping and movement
- Professional studio lighting and background

VERIFICATION CHECK: If the result shows a different person, hair color, or facial features, the task has failed completely.`;

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
      }]
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

    const prompt = `CRITICAL INSTRUCTION: You must preserve the EXACT SAME PERSON'S FACE from the first image. This is the most important requirement.

FACE PRESERVATION (ABSOLUTELY MANDATORY):
- DO NOT change the person's identity, face, or appearance
- DO NOT alter hair color, eye color, skin tone, or facial features
- DO NOT create a different person or model
- DO NOT change facial structure, nose, mouth, eyes, or jawline
- The person's head, face, and hair must remain completely identical
- Only swap the clothing items - NOTHING ELSE
- This is a clothing swap only - not a person replacement

TASK: Take the clothing items from the additional images and place them on the SAME PERSON from the first image.

CLOTHING SWAP ONLY:
- COMPLETELY REMOVE and replace any original clothing that conflicts with the new items
- Apply all provided fashion items together to create one complete outfit  
- If multiple items conflict, intelligently choose the most appropriate combination
- Keep the same person's body, just change their clothes

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

FINAL REQUIREMENTS:
- Same face, hair, and person - only different clothes
- Professional studio lighting and background
- The result must show the identical person from the first image

VERIFICATION CHECK: If the result shows a different person, hair color, or facial features, the task has failed completely.`;

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
      }]
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
