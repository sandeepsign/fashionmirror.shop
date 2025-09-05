import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTryOnResultSchema } from "@shared/schema";
import { generateVirtualTryOn, imageBufferToBase64 } from "./services/gemini";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all fashion items
  app.get("/api/fashion-items", async (req, res) => {
    try {
      const items = await storage.getFashionItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching fashion items:", error);
      res.status(500).json({ error: "Failed to fetch fashion items" });
    }
  });

  // Get fashion items by category
  app.get("/api/fashion-items/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const items = await storage.getFashionItemsByCategory(category);
      res.json(items);
    } catch (error) {
      console.error("Error fetching fashion items by category:", error);
      res.status(500).json({ error: "Failed to fetch fashion items" });
    }
  });

  // Get try-on results for a user (for demo purposes, no auth required)
  app.get("/api/try-on-results", async (req, res) => {
    try {
      const { userId } = req.query;
      if (userId) {
        const results = await storage.getTryOnResultsByUserId(userId as string);
        res.json(results);
      } else {
        // For demo, return empty array if no userId provided
        res.json([]);
      }
    } catch (error) {
      console.error("Error fetching try-on results:", error);
      res.status(500).json({ error: "Failed to fetch try-on results" });
    }
  });

  // Generate batch virtual try-on
  app.post("/api/try-on/generate-batch", upload.array('files'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const { userId } = req.body;
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      
      // First file should be the model image
      const modelImage = files[0];
      if (!modelImage.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: "First file must be a model image" });
      }
      
      // Parse fashion items from form data
      const fashionItems: Array<{
        image: Express.Multer.File;
        name: string;
        category: string;
        source: string;
        collectionId?: string;
      }> = [];
      
      // Extract fashion items from files (skip first model image)
      const fashionImageFiles = files.slice(1);
      
      for (let i = 0; i < fashionImageFiles.length; i++) {
        const name = req.body[`fashionItems[${i}][name]`] || `Fashion Item ${i + 1}`;
        const category = req.body[`fashionItems[${i}][category]`] || 'Custom';
        const source = req.body[`fashionItems[${i}][source]`] || 'upload';
        const collectionId = req.body[`fashionItems[${i}][collectionId]`];
        
        fashionItems.push({
          image: fashionImageFiles[i],
          name,
          category,
          source,
          collectionId
        });
      }
      
      if (fashionItems.length === 0) {
        return res.status(400).json({ error: "At least one fashion item is required" });
      }
      
      const modelImageBase64 = imageBufferToBase64(modelImage.buffer);
      const results = [];
      
      // Process each fashion item sequentially
      for (let i = 0; i < fashionItems.length; i++) {
        const item = fashionItems[i];
        
        try {
          const fashionImageBase64 = imageBufferToBase64(item.image.buffer);
          
          // Generate virtual try-on using Gemini
          const result = await generateVirtualTryOn({
            modelImageBase64,
            fashionImageBase64,
            fashionItemName: item.name,
            fashionCategory: item.category
          });
          
          if (result.success) {
            // Create data URLs for the images
            const modelImageUrl = `data:${modelImage.mimetype};base64,${modelImageBase64}`;
            const fashionImageUrl = `data:${item.image.mimetype};base64,${fashionImageBase64}`;
            const resultImageUrl = `data:image/jpeg;base64,${result.resultImageBase64}`;
            
            // Save the try-on result
            const tryOnResult = await storage.createTryOnResult({
              userId: userId || null,
              modelImageUrl,
              fashionImageUrl,
              resultImageUrl,
              fashionItemName: item.name,
              fashionCategory: item.category,
              metadata: {
                timestamp: new Date().toISOString(),
                batchIndex: i,
                totalItems: fashionItems.length,
                modelImageSize: modelImage.size,
                fashionImageSize: item.image.size
              }
            });
            
            results.push(tryOnResult);
          }
        } catch (itemError) {
          console.error(`Error processing fashion item ${i}:`, itemError);
          // Continue processing other items even if one fails
        }
      }
      
      res.json({
        success: true,
        results,
        completed: results.length,
        total: fashionItems.length
      });
      
    } catch (error) {
      console.error("Error generating batch virtual try-on:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate batch try-on results" 
      });
    }
  });

  // Generate virtual try-on (single item - keep for backward compatibility)
  app.post("/api/try-on/generate", upload.fields([
    { name: 'modelImage', maxCount: 1 },
    { name: 'fashionImage', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const { fashionItemName, fashionCategory, userId } = req.body;

      if (!files.modelImage || !files.fashionImage) {
        return res.status(400).json({ error: "Both model and fashion images are required" });
      }

      if (!fashionItemName || !fashionCategory) {
        return res.status(400).json({ error: "Fashion item name and category are required" });
      }

      const modelImage = files.modelImage[0];
      const fashionImage = files.fashionImage[0];

      // Convert images to base64
      const modelImageBase64 = imageBufferToBase64(modelImage.buffer);
      const fashionImageBase64 = imageBufferToBase64(fashionImage.buffer);

      // Generate virtual try-on using Gemini
      const result = await generateVirtualTryOn({
        modelImageBase64,
        fashionImageBase64,
        fashionItemName,
        fashionCategory
      });

      if (!result.success) {
        return res.status(500).json({ 
          error: result.error || "Failed to generate try-on result" 
        });
      }

      // For demo purposes, create data URLs for the images
      const modelImageUrl = `data:${modelImage.mimetype};base64,${modelImageBase64}`;
      const fashionImageUrl = `data:${fashionImage.mimetype};base64,${fashionImageBase64}`;
      const resultImageUrl = `data:image/jpeg;base64,${result.resultImageBase64}`;

      // Save the try-on result
      const tryOnResult = await storage.createTryOnResult({
        userId: userId || null,
        modelImageUrl,
        fashionImageUrl,
        resultImageUrl,
        fashionItemName,
        fashionCategory,
        metadata: {
          timestamp: new Date().toISOString(),
          modelImageSize: modelImage.size,
          fashionImageSize: fashionImage.size
        }
      });

      res.json({
        success: true,
        result: tryOnResult
      });

    } catch (error) {
      console.error("Error generating virtual try-on:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate try-on result" 
      });
    }
  });

  // Get a specific fashion item
  app.get("/api/fashion-items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const item = await storage.getFashionItem(id);
      if (!item) {
        return res.status(404).json({ error: "Fashion item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching fashion item:", error);
      res.status(500).json({ error: "Failed to fetch fashion item" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      geminiApiKey: !!process.env.GEMINI_API_KEY
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
