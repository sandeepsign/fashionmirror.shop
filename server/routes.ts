import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { insertTryOnResultSchema, registerUserSchema, loginUserSchema } from "@shared/schema";
import { generateVirtualTryOn, generateSimultaneousTryOn, generateProgressiveTryOn, imageBufferToBase64 } from "./services/gemini";
import { analyzeImageWithAI } from "./services/imageAnalyzer";
import { generateVerificationToken, hashVerificationToken, sendVerificationEmail, sendWelcomeEmail } from "./services/emailVerification";
import { generateUserApiKeys, generateWebhookSecret } from "./services/merchantService";
import { requireAuth, optionalAuth } from "./middleware/auth";
import { incrementQuota } from "./middleware/widgetAuth";
import widgetRouter from "./routes/widget";
import accountRouter from "./routes/account";
import multer from "multer";
import bcrypt from "bcrypt";
import { z } from "zod";

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

// Utility function to validate and sanitize text prompts
function validateTextPrompt(textPrompt: any): string | undefined {
  if (!textPrompt || typeof textPrompt !== 'string') {
    return undefined;
  }
  
  const sanitized = textPrompt.trim();
  if (sanitized.length === 0) {
    return undefined;
  }
  
  if (sanitized.length > 500) {
    throw new Error('Text prompt must be 500 characters or less');
  }
  
  return sanitized;
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Mirror.Me Widget API routes
  app.use("/api/widget", widgetRouter);

  // Unified Account API routes (replaces merchant routes)
  app.use("/api/account", accountRouter);

  // Authentication routes

  // User registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validationResult = registerUserSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed",
          details: validationResult.error.errors 
        });
      }

      const { username, email, password } = validationResult.data;

      // Check if user already exists
      const storage = await getStorage();
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "User with this email already exists" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(409).json({ error: "Username already taken" });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Generate verification token
      const verificationData = generateVerificationToken();

      // Generate API keys for the new user
      const { liveKey, testKey } = generateUserApiKeys();
      const webhookSecret = generateWebhookSecret();

      // Create default API key in the new format
      const defaultApiKey = {
        id: crypto.randomUUID(),
        key: liveKey,
        name: 'Default Key',
        createdAt: new Date().toISOString(),
      };

      // Create user with unverified status and API keys
      const newUser = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role: "user",
        isVerified: "false",
        verificationToken: verificationData.hashedToken,
        verificationTokenExpires: verificationData.expiresAt,
        // API keys and quota (generated at registration)
        liveKey,
        testKey,
        apiKeys: [defaultApiKey],  // Default key in new format
        webhookSecret,
        allowedDomains: [],
        plan: "free",
        totalQuota: 100,
        quotaUsed: 0,
        settings: {},
      });

      // Send verification email
      try {
        await sendVerificationEmail(email, username, verificationData.token);
        
        res.status(201).json({ 
          message: "Registration successful! Please check your email to verify your account before logging in.",
          requiresVerification: true
        });
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        res.status(201).json({ 
          message: "Registration successful, but failed to send verification email. Please contact support.",
          requiresVerification: true
        });
      }

    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  // Resend verification email
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: "Email is required" });
      }

      // Find user by email
      const storage = await getStorage();
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal that user doesn't exist for security reasons
        return res.status(200).json({ 
          message: "If an account with this email exists and is unverified, a new verification email has been sent." 
        });
      }

      // Check if user is already verified
      if (user.isVerified === "true") {
        return res.status(400).json({ 
          error: "This account is already verified. Please try logging in." 
        });
      }

      // Generate new verification token
      const verificationData = generateVerificationToken();
      
      // Update user with new verification token
      await storage.updateUserVerificationToken(user.id, verificationData.hashedToken, verificationData.expiresAt);

      // Send verification email
      try {
        await sendVerificationEmail(email, user.username, verificationData.token);
        res.status(200).json({ 
          message: "A new verification email has been sent. Please check your email." 
        });
      } catch (emailError) {
        console.error("Failed to resend verification email:", emailError);
        res.status(500).json({ 
          error: "Failed to send verification email. Please try again later." 
        });
      }

    } catch (error) {
      console.error("Error during resend verification:", error);
      res.status(500).json({ error: "Failed to resend verification email" });
    }
  });

  // User login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validationResult = loginUserSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed",
          details: validationResult.error.errors 
        });
      }

      const { email, password } = validationResult.data;

      // Find user by email
      const storage = await getStorage();
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Check if user is verified
      if (user.isVerified !== "true") {
        return res.status(401).json({ 
          error: "Please verify your email address before logging in. Check your email for a verification link.",
          requiresVerification: true,
          email: user.email
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Regenerate session to prevent session fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ error: "Failed to create secure session" });
        }

        // Create session for authenticated user - only store userId for security
        req.session.userId = user.id;

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.json({ 
          message: "Login successful", 
          user: userWithoutPassword 
        });
      });

    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Email verification endpoint
  app.get("/api/auth/verify/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      // Validate token format
      if (!token || typeof token !== 'string' || token.length < 10) {
        return res.status(400).json({ error: "Invalid verification token format" });
      }

      // Hash the token for database lookup
      const hashedToken = hashVerificationToken(token);

      // Find user by verification token
      const storage = await getStorage();
      const user = await storage.getUserByVerificationToken(hashedToken);
      
      if (!user) {
        return res.status(400).json({ 
          error: "Invalid or expired verification token. Please request a new verification email." 
        });
      }

      // Check token expiration
      if (user.verificationTokenExpires && new Date() > user.verificationTokenExpires) {
        return res.status(400).json({ 
          error: "Verification token has expired. Please register again or request a new verification email." 
        });
      }

      // Check if already verified
      if (user.isVerified === "true") {
        return res.status(200).json({ 
          message: "Email already verified. You can now log in.",
          alreadyVerified: true
        });
      }

      // Update user verification status
      const verifiedUser = await storage.updateUserVerification(user.id, "true", true);

      // Send welcome email (non-blocking)
      try {
        await sendWelcomeEmail(user.email, user.username);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Continue even if welcome email fails - verification is still successful
      }

      res.status(200).json({
        message: "Email verified successfully! You can now log in to your account.",
        verified: true
      });

    } catch (error) {
      console.error("Error during email verification:", error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('database') || error.message.includes('connection')) {
          return res.status(503).json({ error: "Service temporarily unavailable. Please try again later." });
        }
      }
      
      res.status(500).json({ error: "Failed to verify email. Please try again or contact support." });
    }
  });

  // Frontend verification page endpoint 
  app.get("/verify-email/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const storage = await getStorage();
      
      // Validate token format
      if (!token || typeof token !== 'string' || token.length < 10) {
        return res.redirect(`/?verification=invalid`);
      }
      
      // Hash the token for database lookup
      const hashedToken = hashVerificationToken(token);
      const user = await storage.getUserByVerificationToken(hashedToken);
      
      if (!user) {
        // Redirect to frontend with error state
        return res.redirect(`/?verification=invalid`);
      }

      // Check token expiration
      if (user.verificationTokenExpires && new Date() > user.verificationTokenExpires) {
        return res.redirect(`/?verification=expired`);
      }

      if (user.isVerified === "true") {
        // Already verified, redirect to login
        return res.redirect(`/?verification=already-verified`);
      }

      // Update verification status
      await storage.updateUserVerification(user.id, "true", true);

      // Send welcome email (non-blocking)
      try {
        await sendWelcomeEmail(user.email, user.username);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail verification if welcome email fails
      }

      // Redirect to frontend with success state
      res.redirect(`/?verification=success&email=${encodeURIComponent(user.email)}`);

    } catch (error) {
      console.error("Error in verification page:", error);
      
      // Provide more specific error handling
      if (error instanceof Error && error.message.includes('database')) {
        return res.redirect(`/?verification=service-error`);
      }
      
      res.redirect(`/?verification=error`);
    }
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    // User is guaranteed to be present due to requireAuth middleware
    res.json({ 
      user: req.user 
    });
  });

  // Logout
  app.post("/api/auth/logout", async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie('fashionmirror.sid'); // Clear session cookie
      res.json({ message: "Logout successful" });
    });
  });
  
  // Get all fashion items
  app.get("/api/fashion-items", optionalAuth, async (req, res) => {
    try {
      const storage = await getStorage();
      const userId = req.user?.id; // Use authenticated user's ID or undefined for guests
      const items = await storage.getFashionItems(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching fashion items:", error);
      res.status(500).json({ error: "Failed to fetch fashion items" });
    }
  });

  // Get fashion items by category
  app.get("/api/fashion-items/category/:category", optionalAuth, async (req, res) => {
    try {
      const { category } = req.params;
      const storage = await getStorage();
      const userId = req.user?.id; // Use authenticated user's ID or undefined for guests
      const items = await storage.getFashionItemsByCategory(category, userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching fashion items by category:", error);
      res.status(500).json({ error: "Failed to fetch fashion items" });
    }
  });

  // Get try-on results for authenticated user
  app.get("/api/try-on-results", requireAuth, async (req, res) => {
    try {
      const storage = await getStorage();
      const results = await storage.getTryOnResultsByUserId(req.user!.id);
      res.json(results);
    } catch (error) {
      console.error("Error fetching try-on results:", error);
      res.status(500).json({ error: "Failed to fetch try-on results" });
    }
  });

  // Delete fashion item endpoint
  app.delete("/api/fashion-items/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: "Fashion item ID is required" });
      }

      const storage = await getStorage();
      const success = await storage.deleteFashionItem(id, req.user!.id);

      if (!success) {
        return res.status(404).json({ error: "Fashion item not found or you don't have permission to delete it" });
      }

      res.json({ success: true, message: "Fashion item deleted successfully" });
    } catch (error) {
      console.error("Error deleting fashion item:", error);
      res.status(500).json({ error: "Failed to delete fashion item" });
    }
  });

  // Delete try-on result endpoint
  app.delete("/api/try-on-results/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: "Try-on result ID is required" });
      }

      const storage = await getStorage();
      const success = await storage.deleteTryOnResult(id, req.user!.id);

      if (!success) {
        return res.status(404).json({ error: "Try-on result not found or you don't have permission to delete it" });
      }

      res.json({ success: true, message: "Try-on result deleted successfully" });
    } catch (error) {
      console.error("Error deleting try-on result:", error);
      res.status(500).json({ error: "Failed to delete try-on result" });
    }
  });

  // Generate batch virtual try-on
  app.post("/api/try-on/generate-batch", requireAuth, upload.array('files'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const userId = req.user!.id; // Use authenticated user's ID
      
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
      
      // Extract and validate text prompt if provided
      let textPrompt: string | undefined;
      try {
        textPrompt = validateTextPrompt(req.body.textPrompt);
      } catch (validationError) {
        return res.status(400).json({ 
          error: validationError instanceof Error ? validationError.message : "Invalid text prompt" 
        });
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
            fashionCategory: item.category,
            textPrompt,
            userId
          });
          
          if (result.success) {
            // Create data URLs for the images (model and fashion)
            const modelImageUrl = `data:${modelImage.mimetype};base64,${modelImageBase64}`;
            const fashionImageUrl = `data:${item.image.mimetype};base64,${fashionImageBase64}`;
            // Result image is now a filesystem URL
            const resultImageUrl = result.resultImageUrl;
            
            // Save the try-on result
            const storage = await getStorage();
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
                fashionImageSize: item.image.size,
                textPrompt: textPrompt || undefined
              }
            });
            
            results.push(tryOnResult);

            // Increment quota for each successful try-on
            await incrementQuota(userId);
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

  // Generate simultaneous virtual try-on (all items at once)
  app.post("/api/try-on/generate-simultaneous", requireAuth, upload.array('files'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const userId = req.user!.id; // Use authenticated user's ID
      
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

      // Extract and validate text prompt if provided
      let textPrompt: string | undefined;
      try {
        textPrompt = validateTextPrompt(req.body.textPrompt);
      } catch (validationError) {
        return res.status(400).json({ 
          error: validationError instanceof Error ? validationError.message : "Invalid text prompt" 
        });
      }

      const modelImageBase64 = imageBufferToBase64(modelImage.buffer);
      const fashionImagesBase64 = fashionItems.map(item => imageBufferToBase64(item.image.buffer));

      // Generate virtual try-on using Gemini with all items simultaneously
      const result = await generateSimultaneousTryOn({
        modelImageBase64,
        fashionImagesBase64,
        textPrompt,
        userId
      });

      if (!result.success) {
        return res.status(500).json({ 
          error: result.error || "Failed to generate simultaneous try-on result" 
        });
      }

      // Create data URLs for the images
      const modelImageUrl = `data:${modelImage.mimetype};base64,${modelImageBase64}`;
      const fashionImageUrls = fashionItems.map((item, index) => 
        `data:${item.image.mimetype};base64,${fashionImagesBase64[index]}`
      );
      // Result image is now a filesystem URL
      const resultImageUrl = result.resultImageUrl;

      // Create a combined fashion item name for display purposes
      const combinedFashionItemName = fashionItems.map(item => item.name).join(', ');
      const combinedFashionCategory = 'Combined Outfit';

      // Save the try-on result
      const storage = await getStorage();
      const tryOnResult = await storage.createTryOnResult({
        userId: userId || null,
        modelImageUrl,
        fashionImageUrl: fashionImageUrls[0], // Use first item's URL for backward compatibility
        resultImageUrl,
        fashionItemName: combinedFashionItemName,
        fashionCategory: combinedFashionCategory,
        metadata: {
          timestamp: new Date().toISOString(),
          modelImageSize: modelImage.size,
          fashionImageSizes: fashionItems.map(item => item.image.size),
          fashionImageUrls: fashionImageUrls, // Store all fashion image URLs
          fashionItems: fashionItems.map(item => ({
            name: item.name,
            category: item.category,
            source: item.source,
            collectionId: item.collectionId
          })),
          generationType: 'simultaneous',
          textPrompt: textPrompt || undefined
        }
      });

      // Increment quota for the simultaneous try-on
      await incrementQuota(userId);

      res.json({
        success: true,
        result: tryOnResult
      });

    } catch (error) {
      console.error("Error generating simultaneous virtual try-on:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate simultaneous try-on result" 
      });
    }
  });

  // Generate single step of progressive try-on
  app.post("/api/try-on/generate-step", requireAuth, upload.fields([
    { name: 'modelImage', maxCount: 1 },
    { name: 'fashionImage', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const { fashionItemName, fashionCategory, stepNumber } = req.body;
      let textPrompt: string | undefined;
      try {
        textPrompt = validateTextPrompt(req.body.textPrompt);
      } catch (validationError) {
        return res.status(400).json({ 
          error: validationError instanceof Error ? validationError.message : "Invalid text prompt" 
        });
      }
      const userId = req.user!.id; // Use authenticated user's ID

      if (!files.modelImage || !files.fashionImage) {
        return res.status(400).json({ error: "Both model and fashion images are required" });
      }

      if (!fashionItemName || !fashionCategory) {
        return res.status(400).json({ error: "Fashion item name and category are required" });
      }

      const modelImage = files.modelImage[0];
      const fashionImage = files.fashionImage[0];

      console.log(`Generating step ${stepNumber || '1'}: Processing ${fashionItemName}`);
      console.log(`TextPrompt received: ${textPrompt ? `"${textPrompt}"` : 'undefined/empty'}`);

      // Convert images to base64
      const modelImageBase64 = imageBufferToBase64(modelImage.buffer);
      const fashionImageBase64 = imageBufferToBase64(fashionImage.buffer);

      // Generate virtual try-on for this step
      const result = await generateVirtualTryOn({
        modelImageBase64,
        fashionImageBase64,
        fashionItemName,
        fashionCategory,
        textPrompt,
        userId
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error || "Failed to generate try-on result" });
      }

      console.log(`Step ${stepNumber || '1'} completed successfully`);

      res.json({
        success: true,
        stepNumber: parseInt(stepNumber) || 1,
        resultImageUrl: result.resultImageUrl
      });
      
    } catch (error) {
      console.error("Error generating progressive step:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate progressive step" 
      });
    }
  });

  // Progressive try-on endpoint (applies fashion items one by one)
  app.post("/api/try-on/generate-progressive", requireAuth, upload.array('files'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const userId = req.user!.id; // Use authenticated user's ID
      
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

      // Extract and validate text prompt if provided
      let textPrompt: string | undefined;
      try {
        textPrompt = validateTextPrompt(req.body.textPrompt);
      } catch (validationError) {
        return res.status(400).json({ 
          error: validationError instanceof Error ? validationError.message : "Invalid text prompt" 
        });
      }

      const modelImageBase64 = imageBufferToBase64(modelImage.buffer);
      const fashionImagesBase64 = fashionItems.map(item => imageBufferToBase64(item.image.buffer));

      // Generate virtual try-on using progressive layering
      const result = await generateProgressiveTryOn({
        modelImageBase64,
        fashionImagesBase64,
        textPrompt,
        userId
      });

      if (!result.success) {
        return res.status(500).json({ 
          error: result.error || "Failed to generate progressive try-on result" 
        });
      }

      // Create data URLs for the images
      const modelImageUrl = `data:${modelImage.mimetype};base64,${modelImageBase64}`;
      const fashionImageUrls = fashionItems.map((item, index) => 
        `data:${item.image.mimetype};base64,${fashionImagesBase64[index]}`
      );
      // Result image is now a filesystem URL
      const resultImageUrl = result.resultImageUrl;

      // Create a combined fashion item name for display purposes
      const combinedFashionItemName = fashionItems.map(item => item.name).join(', ');
      const combinedFashionCategory = 'Progressive Outfit';

      // Save the try-on result with progressive metadata
      const storage = await getStorage();
      const tryOnResult = await storage.createTryOnResult({
        userId: userId || null,
        modelImageUrl,
        fashionImageUrl: fashionImageUrls[0], // Use first item's URL for backward compatibility
        resultImageUrl,
        fashionItemName: combinedFashionItemName,
        fashionCategory: combinedFashionCategory,
        metadata: {
          timestamp: new Date().toISOString(),
          modelImageSize: modelImage.size,
          fashionImageSizes: fashionItems.map(item => item.image.size),
          fashionImageUrls: fashionImageUrls,
          fashionItems: fashionItems.map(item => ({
            name: item.name,
            category: item.category,
            source: item.source,
            collectionId: item.collectionId
          })),
          generationType: 'progressive',
          stepResults: result.stepResults, // Store intermediate results
          textPrompt: textPrompt || undefined
        }
      });

      // Increment quota for the progressive try-on
      await incrementQuota(userId);

      res.json({
        success: true,
        result: tryOnResult,
        stepResults: result.stepResults // Include intermediate step images
      });

    } catch (error) {
      console.error("Error generating progressive virtual try-on:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate progressive try-on result" 
      });
    }
  });

  // Generate virtual try-on (single item - keep for backward compatibility)
  app.post("/api/try-on/generate", requireAuth, upload.fields([
    { name: 'modelImage', maxCount: 1 },
    { name: 'fashionImage', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const { fashionItemName, fashionCategory } = req.body;
      let textPrompt: string | undefined;
      try {
        textPrompt = validateTextPrompt(req.body.textPrompt);
      } catch (validationError) {
        return res.status(400).json({ 
          error: validationError instanceof Error ? validationError.message : "Invalid text prompt" 
        });
      }
      const userId = req.user!.id; // Use authenticated user's ID

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
        fashionCategory,
        textPrompt,
        userId
      });

      if (!result.success) {
        return res.status(500).json({ 
          error: result.error || "Failed to generate try-on result" 
        });
      }

      // For demo purposes, create data URLs for the images
      const modelImageUrl = `data:${modelImage.mimetype};base64,${modelImageBase64}`;
      const fashionImageUrl = `data:${fashionImage.mimetype};base64,${fashionImageBase64}`;
      // Result image is now a filesystem URL
      const resultImageUrl = result.resultImageUrl;

      // Save the try-on result
      const storage = await getStorage();
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
          fashionImageSize: fashionImage.size,
          textPrompt: textPrompt || undefined
        }
      });

      // Increment quota for the try-on
      await incrementQuota(userId);

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
      const storage = await getStorage();
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

  // Analyze uploaded fashion image with AI
  app.post("/api/fashion-items/analyze", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const analysis = await analyzeImageWithAI(req.file.buffer);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing fashion image:", error);
      res.status(500).json({ error: "Failed to analyze image" });
    }
  });

  // Save analyzed fashion item to collection
  app.post("/api/fashion-items", requireAuth, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const { name, category, description } = req.body;
      
      if (!name || !category) {
        return res.status(400).json({ error: "Name and category are required" });
      }

      // Convert image to base64 for storage
      const imageBase64 = imageBufferToBase64(req.file.buffer);
      const imageUrl = `data:image/jpeg;base64,${imageBase64}`;

      const storage = await getStorage();
      const newItem = await storage.createFashionItem({
        name,
        category,
        imageUrl,
        description: description || `User uploaded: ${name}`,
        userId: req.user!.id, // Use authenticated user's ID
        isShared: "false" // User uploaded items are private to the user
      });

      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error saving fashion item:", error);
      res.status(500).json({ error: "Failed to save fashion item" });
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
