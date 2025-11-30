import * as fs from "fs";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { mediaStorage } from "./mediaStorage";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

// Function to generate progressive instructions for individual fashion items using OpenAI
async function generateProgressiveInstructions(fashionItemBase64: string, stepNumber: number, isFirstStep: boolean): Promise<string> {
  try {
    const instructionPrompt = `Analyze this single fashion item and generate specific instructions for applying it ${isFirstStep ? 'to the original model' : 'to a model who already has previous fashion items applied'}.

CONTEXT:
- This is step ${stepNumber} of a progressive fashion try-on process
- ${isFirstStep ? 'This is the first item being applied to the original model photo' : 'The model already has previous fashion items from earlier steps'}

ITEM CATEGORIES:
- Accessories (hats, caps, jewelry, bags, belts, scarves): Should be ADDED without changing any existing clothing
- Footwear (shoes, boots, sandals, sneakers): Should replace only footwear, keep all clothing intact  
- Tops (shirts, blouses, jackets, blazers, sweaters): Should replace only tops, keep bottoms and accessories
- Bottoms (pants, skirts, shorts): Should replace only bottoms, keep tops and accessories
- Dresses/Jumpsuits: Should replace entire outfit except accessories and footwear
- Outerwear (coats, jackets): Should be layered over existing clothing

INSTRUCTION FORMAT:
${isFirstStep 
  ? 'Generate instructions for the first application like: "Replace the original [clothing type] with this [item] while keeping all other aspects of the model unchanged"'
  : 'Generate instructions for progressive addition like: "Add this [item] while keeping ALL existing clothing and accessories from previous steps completely unchanged"'
}

Be very specific about preservation. Examples:
- If it's a hat in step 2+: "Add this hat while keeping ALL existing clothing and accessories from previous steps exactly as they are"
- If it's jewelry in step 3+: "Add this jewelry while preserving ALL existing outfit elements from steps 1 and 2"
- If it's a dress in step 1: "Replace the original outfit with this dress while keeping the model's identity unchanged"

Generate clear, specific progressive instruction for this single item:`;

    const messages: any[] = [
      {
        role: "user",
        content: [
          { type: "text", text: instructionPrompt },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${fashionItemBase64}` }
          }
        ]
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 300,
      temperature: 0.2
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      return isFirstStep 
        ? "Apply this fashion item while preserving the model's identity."
        : "Add this fashion item while keeping all existing clothing and accessories from previous steps unchanged.";
    }

    return result.trim();
  } catch (error) {
    console.error("Error generating progressive instructions with OpenAI:", error);
    return isFirstStep 
      ? "Apply this fashion item while preserving the model's identity."
      : "Add this fashion item while keeping all existing clothing and accessories from previous steps unchanged.";
  }
}

// Function to generate context-aware instructions for fashion items using OpenAI
async function generateItemInstructions(fashionItemsBase64: string[]): Promise<string> {
  try {
    const instructionPrompt = `Analyze the fashion items in the provided images and generate specific, precise instructions for applying them to a model while preserving existing clothing.

For each item, determine its category and provide specific preservation instructions:

ITEM CATEGORIES:
- Accessories (hats, caps, jewelry, bags, belts, scarves): Should be ADDED without changing any existing clothing
- Footwear (shoes, boots, sandals, sneakers): Should replace only footwear, keep all clothing intact  
- Tops (shirts, blouses, jackets, blazers, sweaters): Should replace only tops, keep bottoms and accessories
- Bottoms (pants, skirts, shorts): Should replace only bottoms, keep tops and accessories
- Dresses/Jumpsuits: Should replace entire outfit except accessories and footwear
- Outerwear (coats, jackets): Should be layered over existing clothing

INSTRUCTION FORMAT:
For each item, write a specific instruction like:
- "Add this [item type] while keeping the existing [specific clothing items] completely unchanged"
- "Replace only the [item category] while preserving the existing [other categories]"

Be very specific about what to preserve. For example:
- If it's a hat: "Add this hat/cap while keeping the existing dress/outfit exactly as it is"
- If it's a handbag: "Add this handbag while keeping all existing clothing (dress, shoes, jewelry) unchanged"
- If it's a dress: "Replace the existing outfit with this dress while keeping any accessories and footwear intact"

Generate clear, specific instructions for the items provided.`;

    // Prepare images for OpenAI format
    const imageUrls = fashionItemsBase64.map(base64 => `data:image/jpeg;base64,${base64}`);
    
    const messages: any[] = [
      {
        role: "user",
        content: [
          { type: "text", text: instructionPrompt },
          ...imageUrls.map(url => ({
            type: "image_url",
            image_url: { url }
          }))
        ]
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 500,
      temperature: 0.3
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      return "Apply the fashion items while preserving the model's identity and existing clothing where appropriate.";
    }

    return result.trim();
  } catch (error) {
    console.error("Error generating item instructions with OpenAI:", error);
    return "Apply the fashion items while preserving the model's identity and existing clothing where appropriate.";
  }
}

export interface VirtualTryOnRequest {
  modelImageBase64: string;
  fashionImageBase64: string;
  fashionItemName: string;
  fashionCategory: string;
  textPrompt?: string;
}

export interface VirtualTryOnResponse {
  resultImageUrl: string;
  success: boolean;
  error?: string;
}

export interface SimultaneousTryOnRequest {
  modelImageBase64: string;
  fashionImagesBase64: string[];
  textPrompt?: string;
}

export interface SimultaneousTryOnResponse {
  resultImageUrl: string;
  success: boolean;
  error?: string;
}

export interface ProgressiveTryOnRequest {
  modelImageBase64: string;
  fashionImagesBase64: string[];
  textPrompt?: string;
}

export interface ProgressiveTryOnResponse {
  resultImageUrl: string;
  success: boolean;
  error?: string;
  stepResults?: string[]; // Array of intermediate result URLs
}

export async function generateVirtualTryOn({
  modelImageBase64,
  fashionImageBase64,
  fashionItemName,
  fashionCategory,
  textPrompt,
  userId
}: VirtualTryOnRequest & { userId: string }): Promise<VirtualTryOnResponse> {
  try {
    // First test if the API key works with a simple text model
    try {
      const testResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: ["Hello, are you working?"],
      });
      console.log("API key test successful");
    } catch (testError) {
      console.error("API key test failed:", testError);
      return {
        success: false,
        error: `API key test failed: ${testError instanceof Error ? testError.message : "Unknown error"}`,
        resultImageUrl: ""
      };
    }

    // Generate intelligent instructions for the specific fashion item
    const itemInstructions = await generateItemInstructions([fashionImageBase64]);
    console.log("Generated item-specific instructions:", itemInstructions);

    console.log(`Generating with textPrompt: ${textPrompt ? `"${textPrompt}"` : 'undefined/empty'}`);
    
    const prompt = `CRITICAL INSTRUCTION: You must preserve the EXACT SAME PERSON'S FACE from the first image. This is the most important requirement.

FACE PRESERVATION (ABSOLUTELY MANDATORY):
- DO NOT change the person's identity, face, or appearance
- DO NOT alter hair color, eye color, skin tone, or facial features
- DO NOT create a different person or model
- DO NOT change facial structure, nose, mouth, eyes, or jawline
- The person's head, face, and hair must remain completely identical
- Only apply fashion item - NOTHING ELSE
- This is a clothing application only - not a person replacement

TASK: Take the clothing item from the second image and place it on the SAME PERSON from the first image.

SPECIFIC APPLICATION INSTRUCTIONS:
${itemInstructions}

${textPrompt ? `USER CREATIVE INSTRUCTIONS:
${textPrompt}

` : ''}PROFESSIONAL REQUIREMENTS:
- Make the new item fit naturally with proper shadows and lighting
- Create realistic fabric draping and movement
- Professional studio lighting and background

VERIFICATION CHECK: If the result shows a different person, hair color, or facial features, the task has failed completely.`;

    // Try with the correct API structure
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
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
        resultImageUrl: ""
      };
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      return {
        success: false,
        error: "No content parts returned from AI model",
        resultImageUrl: ""
      };
    }

    for (const part of content.parts) {
      if (part.inlineData && part.inlineData.data) {
        // Save image to filesystem and return URL
        const imageUrl = await saveImageToFilesystem(part.inlineData.data, userId, 'result');
        return {
          success: true,
          resultImageUrl: imageUrl
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
      resultImageUrl: ""
    };

  } catch (error) {
    console.error("Error generating virtual try-on:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      resultImageUrl: ""
    };
  }
}

export async function generateSimultaneousTryOn({
  modelImageBase64,
  fashionImagesBase64,
  textPrompt,
  userId
}: SimultaneousTryOnRequest & { userId: string }): Promise<SimultaneousTryOnResponse> {
  try {
    // Test API key first
    try {
      const testResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: ["Hello, are you working?"],
      });
      console.log("API key test successful for simultaneous try-on");
    } catch (testError) {
      console.error("API key test failed:", testError);
      return {
        success: false,
        error: `API key test failed: ${testError instanceof Error ? testError.message : "Unknown error"}`,
        resultImageUrl: ""
      };
    }

    // Generate intelligent instructions for the specific fashion items
    const itemInstructions = await generateItemInstructions(fashionImagesBase64);
    console.log("Generated item-specific instructions:", itemInstructions);

    const prompt = `CRITICAL INSTRUCTION: You must preserve the EXACT SAME PERSON'S FACE from the first image. This is the most important requirement.

FACE PRESERVATION (ABSOLUTELY MANDATORY):
- DO NOT change the person's identity, face, or appearance
- DO NOT alter hair color, eye color, skin tone, or facial features
- DO NOT create a different person or model
- DO NOT change facial structure, nose, mouth, eyes, or jawline
- The person's head, face, and hair must remain completely identical
- Only apply fashion items - NOTHING ELSE
- This is a clothing application only - not a person replacement

TASK: Take the clothing items from the additional images and place them on the SAME PERSON from the first image.

SPECIFIC APPLICATION INSTRUCTIONS:
${itemInstructions}

${textPrompt ? `USER CREATIVE INSTRUCTIONS:
${textPrompt}

` : ''}PROFESSIONAL QUALITY STANDARDS:
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
      model: "gemini-3-pro-image-preview",
      contents: [{
        parts
      }]
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      return {
        success: false,
        error: "No candidates returned from AI model",
        resultImageUrl: ""
      };
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      return {
        success: false,
        error: "No content parts returned from AI model",
        resultImageUrl: ""
      };
    }

    for (const part of content.parts) {
      if (part.inlineData && part.inlineData.data) {
        // Save image to filesystem and return URL
        const imageUrl = await saveImageToFilesystem(part.inlineData.data, userId, 'result');
        return {
          success: true,
          resultImageUrl: imageUrl
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
      resultImageUrl: ""
    };

  } catch (error) {
    console.error("Error generating simultaneous virtual try-on:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      resultImageUrl: ""
    };
  }
}

export function imageBufferToBase64(buffer: Buffer, mimeType: string = "image/jpeg"): string {
  return buffer.toString("base64");
}

export function base64ToImageBuffer(base64: string): Buffer {
  return Buffer.from(base64, "base64");
}

// Helper function to save base64 image to filesystem and return URL
async function saveImageToFilesystem(base64: string, userId: string, type: 'model' | 'fashion' | 'result' = 'result'): Promise<string> {
  try {
    const buffer = base64ToImageBuffer(base64);
    const result = await mediaStorage.saveImage(buffer, {
      visibility: 'protected',
      type,
      userId,
      ext: 'jpg'
    });
    return result.url;
  } catch (error) {
    console.error('Error saving image to filesystem:', error);
    throw new Error(`Failed to save image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateProgressiveTryOn({
  modelImageBase64,
  fashionImagesBase64,
  textPrompt,
  userId
}: ProgressiveTryOnRequest & { userId: string }): Promise<ProgressiveTryOnResponse> {
  try {
    console.log("Starting progressive try-on generation with", fashionImagesBase64.length, "items");
    
    let currentModelImage = modelImageBase64;
    const stepResults: string[] = [];
    
    // Apply each fashion item progressively
    for (let i = 0; i < fashionImagesBase64.length; i++) {
      const fashionImageBase64 = fashionImagesBase64[i];
      const stepNumber = i + 1;
      const isFirstStep = i === 0;
      
      console.log(`Progressive step ${stepNumber}: Processing fashion item ${i + 1}`);
      
      // Test API key for each step
      try {
        const testResponse = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: ["Hello, are you working?"],
        });
        console.log(`API key test successful for progressive step ${stepNumber}`);
      } catch (testError) {
        console.error("API key test failed:", testError);
        return {
          success: false,
          error: `API key test failed at step ${stepNumber}: ${testError instanceof Error ? testError.message : "Unknown error"}`,
          resultImageUrl: "",
          stepResults
        };
      }

      // Generate specific instructions for this step
      const stepInstructions = await generateProgressiveInstructions(fashionImageBase64, stepNumber, isFirstStep);
      console.log(`Step ${stepNumber} instructions:`, stepInstructions);

      const prompt = `CRITICAL INSTRUCTION: You must preserve the EXACT SAME PERSON'S FACE from the first image. This is the most important requirement.

FACE PRESERVATION (ABSOLUTELY MANDATORY):
- DO NOT change the person's identity, face, or appearance
- DO NOT alter hair color, eye color, skin tone, or facial features
- DO NOT create a different person or model
- DO NOT change facial structure, nose, mouth, eyes, or jawline
- The person's head, face, and hair must remain completely identical
- This is a clothing application only - not a person replacement

PROGRESSIVE STEP ${stepNumber} TASK:
${isFirstStep 
  ? 'Take the fashion item from the second image and apply it to the person from the first image.'
  : 'Take the fashion item from the second image and add it to the person from the first image who already has fashion items applied from previous steps.'
}

SPECIFIC APPLICATION INSTRUCTIONS:
${stepInstructions}

${textPrompt ? `USER CREATIVE INSTRUCTIONS:
${textPrompt}

` : ''}PROFESSIONAL REQUIREMENTS:
- Make the new item fit naturally with proper shadows and lighting
- Create realistic fabric draping and movement
- Professional studio lighting and background
- Seamless integration with any existing clothing

VERIFICATION CHECK: If the result shows a different person, hair color, or facial features, the task has failed completely.`;

      // Generate the step result
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: currentModelImage,
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
          error: `No candidates returned from AI model at step ${stepNumber}`,
          resultImageUrl: "",
          stepResults
        };
      }

      const content = candidates[0].content;
      if (!content || !content.parts) {
        return {
          success: false,
          error: `No content parts returned from AI model at step ${stepNumber}`,
          resultImageUrl: "",
          stepResults
        };
      }

      const imagePart = content.parts.find(part => part.inlineData);
      if (!imagePart || !imagePart.inlineData) {
        return {
          success: false,
          error: `No image data returned from AI model at step ${stepNumber}`,
          resultImageUrl: "",
          stepResults
        };
      }

      const stepResultBase64 = imagePart.inlineData.data;
      if (!stepResultBase64) {
        return {
          success: false,
          error: `No image data returned from AI model at step ${stepNumber}`,
          resultImageUrl: "",
          stepResults
        };
      }
      
      stepResults.push(stepResultBase64);
      
      // Use this result as the model image for the next step
      currentModelImage = stepResultBase64;
      
      console.log(`Progressive step ${stepNumber} completed successfully`);
    }

    console.log("Progressive try-on generation completed successfully");
    
    return {
      success: true,
      resultImageUrl: await saveImageToFilesystem(currentModelImage, userId, 'result'), // Final result
      stepResults
    };

  } catch (error) {
    return {
      success: false,
      error: `Error generating progressive try-on: ${error instanceof Error ? error.message : "Unknown error"}`,
      resultImageUrl: "",
      stepResults: []
    };
  }
}
