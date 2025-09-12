// server/index.ts
import express2 from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path5 from "path";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  isVerified: text("is_verified").notNull().default("false"),
  verificationToken: text("verification_token"),
  verificationTokenExpires: timestamp("verification_token_expires"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull()
});
var tryOnResults = pgTable("try_on_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  modelImageUrl: text("model_image_url").notNull(),
  fashionImageUrl: text("fashion_image_url").notNull(),
  resultImageUrl: text("result_image_url").notNull(),
  fashionItemName: text("fashion_item_name").notNull(),
  fashionCategory: text("fashion_category").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull()
});
var fashionItems = pgTable("fashion_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description"),
  userId: varchar("user_id").references(() => users.id),
  // null for shared/default items, user-specific otherwise
  isShared: text("is_shared").notNull().default("false"),
  // true for default items available to all users
  createdAt: timestamp("created_at").default(sql`now()`).notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  role: true,
  isVerified: true,
  verificationToken: true,
  verificationTokenExpires: true
});
var registerUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters long"),
  email: z.string().email("Invalid email address")
});
var loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});
var insertTryOnResultSchema = createInsertSchema(tryOnResults).omit({
  id: true,
  createdAt: true
});
var insertFashionItemSchema = createInsertSchema(fashionItems).omit({
  id: true,
  createdAt: true
});

// server/storage.ts
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, or, and, desc } from "drizzle-orm";
var MemStorage = class {
  users;
  tryOnResults;
  fashionItems;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.tryOnResults = /* @__PURE__ */ new Map();
    this.fashionItems = /* @__PURE__ */ new Map();
    this.initializeFashionItems();
    this.initializeDefaultAdmin();
  }
  initializeFashionItems() {
    const defaultItems = [
      {
        name: "Athletic Wear Set",
        category: "Fitness",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
        description: "Comfortable athletic wear for fitness activities"
      },
      {
        name: "Red Evening Gown",
        category: "Formal",
        imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
        description: "Elegant red evening gown for special occasions"
      },
      {
        name: "White Summer Blouse",
        category: "Casual",
        imageUrl: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
        description: "Light white blouse perfect for summer casual wear"
      },
      {
        name: "Leather Handbag",
        category: "Accessories",
        imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
        description: "Premium leather handbag"
      },
      {
        name: "Designer Sunglasses",
        category: "Accessories",
        imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
        description: "Stylish designer sunglasses"
      },
      {
        name: "Denim Jacket",
        category: "Casual",
        imageUrl: "https://pixabay.com/get/gf323024bd14f7265133baf65249e87ac2e4d018a3332c7af141135e529eddac3ff55a489c5a1bc4a3c5f0c3428686bfd89d51319a9cc77cba1d6c157ae0c22cb_1280.jpg",
        description: "Classic denim jacket for casual outfits"
      },
      {
        name: "Gold Jewelry Set",
        category: "Accessories",
        imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
        description: "Elegant gold jewelry set"
      },
      {
        name: "Classic Sneakers",
        category: "Footwear",
        imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
        description: "Comfortable white sneakers"
      },
      {
        name: "Professional Backpack",
        category: "Accessories",
        imageUrl: "/black-backpack.png",
        description: "Sleek black professional backpack with modern design"
      }
    ];
    defaultItems.forEach((item) => {
      const id = randomUUID();
      const fashionItem = {
        ...item,
        id,
        description: item.description || null,
        userId: null,
        // Default items are shared
        isShared: "true",
        // Default items are available to all users
        createdAt: /* @__PURE__ */ new Date()
      };
      this.fashionItems.set(id, fashionItem);
    });
  }
  async initializeDefaultAdmin() {
    const existingAdmin = await this.getUserByEmail("admin");
    if (existingAdmin) {
      return;
    }
    const adminId = randomUUID();
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash("W3lcome1!", saltRounds);
    const adminUser = {
      id: adminId,
      username: "admin",
      email: "admin",
      // Using "admin" as email since it's specified as the login
      password: hashedPassword,
      role: "admin",
      isVerified: "true",
      verificationToken: null,
      verificationTokenExpires: null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(adminId, adminUser);
    console.log("Default admin user created: admin / W3lcome1!");
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const user = {
      ...insertUser,
      id,
      role: insertUser.role || "user",
      isVerified: insertUser.isVerified || "false",
      verificationToken: insertUser.verificationToken || null,
      verificationTokenExpires: insertUser.verificationTokenExpires || null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(id, user);
    return user;
  }
  async getUserByVerificationToken(hashedToken) {
    return Array.from(this.users.values()).find(
      (user) => user.verificationToken === hashedToken && user.verificationTokenExpires && user.verificationTokenExpires > /* @__PURE__ */ new Date()
    );
  }
  async updateUserVerification(id, isVerified, clearToken = true) {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    const updatedUser = {
      ...user,
      isVerified,
      verificationToken: clearToken ? null : user.verificationToken,
      verificationTokenExpires: clearToken ? null : user.verificationTokenExpires
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  async updateUserVerificationToken(id, hashedToken, expiresAt) {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    const updatedUser = {
      ...user,
      verificationToken: hashedToken,
      verificationTokenExpires: expiresAt
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  async getTryOnResult(id) {
    return this.tryOnResults.get(id);
  }
  async getTryOnResultsByUserId(userId) {
    const results = Array.from(this.tryOnResults.values()).filter(
      (result) => result.userId === userId
    );
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20).map((result) => ({
      ...result,
      resultImageBase64: "",
      // Clear heavy image data for gallery
      modelImageBase64: ""
      // Clear heavy image data for gallery
    }));
  }
  async createTryOnResult(insertResult) {
    const id = randomUUID();
    const result = {
      ...insertResult,
      id,
      userId: insertResult.userId || null,
      metadata: insertResult.metadata || null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.tryOnResults.set(id, result);
    return result;
  }
  async getFashionItem(id) {
    return this.fashionItems.get(id);
  }
  async getFashionItems(userId) {
    const allItems = Array.from(this.fashionItems.values());
    if (!userId) {
      return allItems.filter((item) => item.isShared === "true");
    }
    return allItems.filter(
      (item) => item.isShared === "true" || item.userId === userId
    );
  }
  async getFashionItemsByCategory(category, userId) {
    const allItems = Array.from(this.fashionItems.values());
    if (!userId) {
      return allItems.filter(
        (item) => item.category.toLowerCase() === category.toLowerCase() && item.isShared === "true"
      );
    }
    return allItems.filter(
      (item) => item.category.toLowerCase() === category.toLowerCase() && (item.isShared === "true" || item.userId === userId)
    );
  }
  async createFashionItem(insertItem) {
    const id = randomUUID();
    const item = {
      ...insertItem,
      id,
      description: insertItem.description || null,
      userId: insertItem.userId ?? null,
      isShared: insertItem.isShared ?? "false",
      createdAt: /* @__PURE__ */ new Date()
    };
    this.fashionItems.set(id, item);
    return item;
  }
  async deleteTryOnResult(id, userId) {
    const result = this.tryOnResults.get(id);
    if (!result) {
      return false;
    }
    if (result.userId !== userId) {
      return false;
    }
    this.tryOnResults.delete(id);
    return true;
  }
  async deleteFashionItem(id, userId) {
    const item = this.fashionItems.get(id);
    if (!item) {
      return false;
    }
    if (item.userId !== userId) {
      return false;
    }
    this.fashionItems.delete(id);
    return true;
  }
};
var DatabaseStorage = class {
  db;
  constructor() {
    const sql3 = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql3);
  }
  async getUser(id) {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  async getUserByUsername(username) {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }
  async getUserByEmail(email) {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }
  async createUser(user) {
    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }
  async getUserByVerificationToken(hashedToken) {
    const result = await this.db.select().from(users).where(eq(users.verificationToken, hashedToken)).limit(1);
    return result[0];
  }
  async updateUserVerification(id, isVerified, clearToken) {
    const updateData = { isVerified };
    if (clearToken) {
      updateData.verificationToken = null;
      updateData.verificationTokenExpires = null;
    }
    const result = await this.db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return result[0];
  }
  async updateUserVerificationToken(id, hashedToken, expiresAt) {
    const result = await this.db.update(users).set({
      verificationToken: hashedToken,
      verificationTokenExpires: expiresAt
    }).where(eq(users.id, id)).returning();
    return result[0];
  }
  async getTryOnResult(id) {
    const result = await this.db.select().from(tryOnResults).where(eq(tryOnResults.id, id)).limit(1);
    return result[0];
  }
  async getTryOnResultsByUserId(userId) {
    const results = await this.db.select().from(tryOnResults).where(eq(tryOnResults.userId, userId)).orderBy(desc(tryOnResults.createdAt)).limit(20);
    return results.map((result) => ({
      ...result,
      modelImageUrl: result.modelImageUrl.length > 1e3 ? "" : result.modelImageUrl,
      fashionImageUrl: result.fashionImageUrl.length > 1e3 ? "" : result.fashionImageUrl,
      resultImageUrl: result.resultImageUrl.length > 1e3 ? "" : result.resultImageUrl
    }));
  }
  async createTryOnResult(result) {
    const insertResult = await this.db.insert(tryOnResults).values(result).returning();
    return insertResult[0];
  }
  async getFashionItem(id) {
    const result = await this.db.select().from(fashionItems).where(eq(fashionItems.id, id)).limit(1);
    return result[0];
  }
  async getFashionItems(userId) {
    if (!userId) {
      return await this.db.select().from(fashionItems).where(eq(fashionItems.isShared, "true"));
    }
    return await this.db.select().from(fashionItems).where(
      or(
        eq(fashionItems.isShared, "true"),
        eq(fashionItems.userId, userId)
      )
    );
  }
  async getFashionItemsByCategory(category, userId) {
    if (!userId) {
      return await this.db.select().from(fashionItems).where(
        and(
          eq(fashionItems.category, category),
          eq(fashionItems.isShared, "true")
        )
      );
    }
    return await this.db.select().from(fashionItems).where(
      and(
        eq(fashionItems.category, category),
        or(
          eq(fashionItems.isShared, "true"),
          eq(fashionItems.userId, userId)
        )
      )
    );
  }
  async createFashionItem(item) {
    const result = await this.db.insert(fashionItems).values(item).returning();
    return result[0];
  }
  async deleteTryOnResult(id, userId) {
    const result = await this.db.delete(tryOnResults).where(
      and(
        eq(tryOnResults.id, id),
        eq(tryOnResults.userId, userId)
      )
    ).returning();
    return result.length > 0;
  }
  async deleteFashionItem(id, userId) {
    const result = await this.db.delete(fashionItems).where(
      and(
        eq(fashionItems.id, id),
        eq(fashionItems.userId, userId)
      )
    ).returning();
    return result.length > 0;
  }
};
async function initializeDatabaseWithDefaults() {
  const dbStorage = new DatabaseStorage();
  try {
    const existingItems = await dbStorage.getFashionItems();
    if (existingItems.length === 0) {
      const defaultItems = [
        {
          name: "Athletic Wear Set",
          category: "Fitness",
          imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
          description: "Comfortable athletic wear for fitness activities",
          userId: null,
          isShared: "true"
        },
        {
          name: "Red Evening Gown",
          category: "Formal",
          imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
          description: "Elegant red evening gown for special occasions",
          userId: null,
          isShared: "true"
        },
        {
          name: "White Summer Blouse",
          category: "Casual",
          imageUrl: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
          description: "Light white blouse perfect for summer casual wear",
          userId: null,
          isShared: "true"
        },
        {
          name: "Leather Handbag",
          category: "Accessories",
          imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
          description: "Premium leather handbag",
          userId: null,
          isShared: "true"
        },
        {
          name: "Designer Sunglasses",
          category: "Accessories",
          imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
          description: "Stylish designer sunglasses",
          userId: null,
          isShared: "true"
        },
        {
          name: "Denim Jacket",
          category: "Casual",
          imageUrl: "https://pixabay.com/get/gf323024bd14f7265133baf65249e87ac2e4d018a3332c7af141135e529eddac3ff55a489c5a1bc4a3c5f0c3428686bfd89d51319a9cc77cba1d6c157ae0c22cb_1280.jpg",
          description: "Classic denim jacket for casual outfits",
          userId: null,
          isShared: "true"
        },
        {
          name: "Gold Jewelry Set",
          category: "Accessories",
          imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
          description: "Elegant gold jewelry set",
          userId: null,
          isShared: "true"
        },
        {
          name: "Classic Sneakers",
          category: "Footwear",
          imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
          description: "Comfortable white sneakers",
          userId: null,
          isShared: "true"
        }
      ];
      for (const item of defaultItems) {
        await dbStorage.createFashionItem(item);
      }
      console.log("Default fashion items initialized in database");
    }
    const adminUser = await dbStorage.getUserByUsername("admin");
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash("W3lcome1!", 12);
      await dbStorage.createUser({
        username: "admin",
        email: "admin@fashionmirror.com",
        password: hashedPassword,
        role: "admin",
        isVerified: "true"
      });
      console.log("Default admin user created: admin / W3lcome1!");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    console.log("Falling back to MemStorage due to database error");
    return new MemStorage();
  }
  return dbStorage;
}
var storageInstance;
async function createStorageInstance() {
  if (!storageInstance) {
    storageInstance = await initializeDatabaseWithDefaults();
  }
  return storageInstance;
}
var getStorage = createStorageInstance;

// server/services/gemini.ts
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

// server/services/mediaStorage.ts
import fs from "fs/promises";
import path from "path";
import { randomUUID as randomUUID2 } from "crypto";
import sharp from "sharp";
var LocalFilesystemMediaStorage = class {
  mediaRoot;
  baseUrl;
  constructor() {
    this.mediaRoot = process.env.MEDIA_ROOT || path.join(process.cwd(), "uploads");
    this.baseUrl = process.env.MEDIA_BASE_URL || "/media";
  }
  async ensureDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true, mode: 488 });
    } catch (error) {
    }
  }
  generatePath(options, filename) {
    const now = /* @__PURE__ */ new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const shard = filename.substring(0, 2);
    const pathParts = [
      options.visibility,
      options.type
    ];
    if (options.visibility === "protected" && options.userId) {
      pathParts.push(options.userId);
    }
    pathParts.push(year, month, day, shard, filename);
    return path.join(...pathParts);
  }
  async validateAndProcessImage(buffer) {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();
      if (!metadata.width || !metadata.height) {
        throw new Error("Invalid image metadata");
      }
      const processed = await image.jpeg({ quality: 85, progressive: true }).toBuffer();
      return {
        processed,
        meta: {
          width: metadata.width,
          height: metadata.height,
          format: "jpeg",
          size: processed.length
        }
      };
    } catch (error) {
      throw new Error(`Invalid image format: ${error}`);
    }
  }
  async saveImage(buffer, options) {
    const { processed, meta } = await this.validateAndProcessImage(buffer);
    const uuid = randomUUID2();
    const ext = options.ext || "jpg";
    const filename = `${uuid}.${ext}`;
    const relativePath = this.generatePath(options, filename);
    const fullPath = path.join(this.mediaRoot, relativePath);
    await this.ensureDirectory(path.dirname(fullPath));
    await fs.writeFile(fullPath, processed, { mode: 416 });
    const thumbPath = path.join(path.dirname(fullPath), `${uuid}-thumb.${ext}`);
    const thumbBuffer = await sharp(processed).resize(256, null, {
      withoutEnlargement: true,
      fit: "inside"
    }).jpeg({ quality: 80 }).toBuffer();
    await fs.writeFile(thumbPath, thumbBuffer, { mode: 416 });
    const mediumPath = path.join(path.dirname(fullPath), `${uuid}-medium.${ext}`);
    const mediumBuffer = await sharp(processed).resize(1024, null, {
      withoutEnlargement: true,
      fit: "inside"
    }).jpeg({ quality: 85 }).toBuffer();
    await fs.writeFile(mediumPath, mediumBuffer, { mode: 416 });
    const urlPath = this.generatePath(options, filename).replace(/\\/g, "/");
    const baseUrl = `${this.baseUrl}/${urlPath}`;
    const thumbUrl = baseUrl.replace(`.${ext}`, `-thumb.${ext}`);
    const mediumUrl = baseUrl.replace(`.${ext}`, `-medium.${ext}`);
    return {
      url: baseUrl,
      paths: {
        original: fullPath,
        thumb: thumbPath,
        medium: mediumPath
      },
      meta
    };
  }
  async deleteByUrl(url) {
    try {
      const filePath = this.getFilePath(url);
      const ext = path.extname(filePath);
      const basePath = filePath.replace(ext, "");
      const filesToDelete = [
        filePath,
        `${basePath}-thumb${ext}`,
        `${basePath}-medium${ext}`
      ];
      await Promise.allSettled(
        filesToDelete.map((file) => fs.unlink(file))
      );
    } catch (error) {
      console.warn(`Failed to delete media file: ${url}`, error);
    }
  }
  getFilePath(url) {
    const urlPath = url.replace(this.baseUrl, "").replace(/^\/+/, "");
    return path.join(this.mediaRoot, urlPath);
  }
  async ensureThumb(url, size = 256) {
    const ext = path.extname(url);
    const thumbUrl = url.replace(ext, `-thumb${ext}`);
    const thumbPath = this.getFilePath(thumbUrl);
    try {
      await fs.access(thumbPath);
      return thumbUrl;
    } catch {
      const originalPath = this.getFilePath(url);
      const originalBuffer = await fs.readFile(originalPath);
      const thumbBuffer = await sharp(originalBuffer).resize(size, null, {
        withoutEnlargement: true,
        fit: "inside"
      }).jpeg({ quality: 80 }).toBuffer();
      await fs.writeFile(thumbPath, thumbBuffer, { mode: 416 });
      return thumbUrl;
    }
  }
};
var mediaStorage = new LocalFilesystemMediaStorage();

// server/services/gemini.ts
var ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });
var openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
async function generateProgressiveInstructions(fashionItemBase64, stepNumber, isFirstStep) {
  try {
    const instructionPrompt = `Analyze this single fashion item and generate specific instructions for applying it ${isFirstStep ? "to the original model" : "to a model who already has previous fashion items applied"}.

CONTEXT:
- This is step ${stepNumber} of a progressive fashion try-on process
- ${isFirstStep ? "This is the first item being applied to the original model photo" : "The model already has previous fashion items from earlier steps"}

ITEM CATEGORIES:
- Accessories (hats, caps, jewelry, bags, belts, scarves): Should be ADDED without changing any existing clothing
- Footwear (shoes, boots, sandals, sneakers): Should replace only footwear, keep all clothing intact  
- Tops (shirts, blouses, jackets, blazers, sweaters): Should replace only tops, keep bottoms and accessories
- Bottoms (pants, skirts, shorts): Should replace only bottoms, keep tops and accessories
- Dresses/Jumpsuits: Should replace entire outfit except accessories and footwear
- Outerwear (coats, jackets): Should be layered over existing clothing

INSTRUCTION FORMAT:
${isFirstStep ? 'Generate instructions for the first application like: "Replace the original [clothing type] with this [item] while keeping all other aspects of the model unchanged"' : 'Generate instructions for progressive addition like: "Add this [item] while keeping ALL existing clothing and accessories from previous steps completely unchanged"'}

Be very specific about preservation. Examples:
- If it's a hat in step 2+: "Add this hat while keeping ALL existing clothing and accessories from previous steps exactly as they are"
- If it's jewelry in step 3+: "Add this jewelry while preserving ALL existing outfit elements from steps 1 and 2"
- If it's a dress in step 1: "Replace the original outfit with this dress while keeping the model's identity unchanged"

Generate clear, specific progressive instruction for this single item:`;
    const messages = [
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
      return isFirstStep ? "Apply this fashion item while preserving the model's identity." : "Add this fashion item while keeping all existing clothing and accessories from previous steps unchanged.";
    }
    return result.trim();
  } catch (error) {
    console.error("Error generating progressive instructions with OpenAI:", error);
    return isFirstStep ? "Apply this fashion item while preserving the model's identity." : "Add this fashion item while keeping all existing clothing and accessories from previous steps unchanged.";
  }
}
async function generateItemInstructions(fashionItemsBase64) {
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
    const imageUrls = fashionItemsBase64.map((base64) => `data:image/jpeg;base64,${base64}`);
    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: instructionPrompt },
          ...imageUrls.map((url) => ({
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
async function generateVirtualTryOn({
  modelImageBase64,
  fashionImageBase64,
  fashionItemName,
  fashionCategory,
  textPrompt,
  userId
}) {
  try {
    try {
      const testResponse = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: ["Hello, are you working?"]
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
    const itemInstructions = await generateItemInstructions([fashionImageBase64]);
    console.log("Generated item-specific instructions:", itemInstructions);
    console.log(`Generating with textPrompt: ${textPrompt ? `"${textPrompt}"` : "undefined/empty"}`);
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

` : ""}PROFESSIONAL REQUIREMENTS:
- Make the new item fit naturally with proper shadows and lighting
- Create realistic fabric draping and movement
- Professional studio lighting and background

VERIFICATION CHECK: If the result shows a different person, hair color, or facial features, the task has failed completely.`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: modelImageBase64,
              mimeType: "image/jpeg"
            }
          },
          {
            inlineData: {
              data: fashionImageBase64,
              mimeType: "image/jpeg"
            }
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
        const imageUrl = await saveImageToFilesystem(part.inlineData.data, userId, "result");
        return {
          success: true,
          resultImageUrl: imageUrl
        };
      }
    }
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
async function generateSimultaneousTryOn({
  modelImageBase64,
  fashionImagesBase64,
  textPrompt,
  userId
}) {
  try {
    try {
      const testResponse = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: ["Hello, are you working?"]
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

` : ""}PROFESSIONAL QUALITY STANDARDS:
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
    const parts = [
      { text: prompt },
      {
        inlineData: {
          data: modelImageBase64,
          mimeType: "image/jpeg"
        }
      }
    ];
    fashionImagesBase64.forEach((fashionImageBase64) => {
      parts.push({
        inlineData: {
          data: fashionImageBase64,
          mimeType: "image/jpeg"
        }
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
        const imageUrl = await saveImageToFilesystem(part.inlineData.data, userId, "result");
        return {
          success: true,
          resultImageUrl: imageUrl
        };
      }
    }
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
function imageBufferToBase64(buffer, mimeType = "image/jpeg") {
  return buffer.toString("base64");
}
function base64ToImageBuffer(base64) {
  return Buffer.from(base64, "base64");
}
async function saveImageToFilesystem(base64, userId, type = "result") {
  try {
    const buffer = base64ToImageBuffer(base64);
    const result = await mediaStorage.saveImage(buffer, {
      visibility: "protected",
      type,
      userId,
      ext: "jpg"
    });
    return result.url;
  } catch (error) {
    console.error("Error saving image to filesystem:", error);
    throw new Error(`Failed to save image: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
async function generateProgressiveTryOn({
  modelImageBase64,
  fashionImagesBase64,
  textPrompt,
  userId
}) {
  try {
    console.log("Starting progressive try-on generation with", fashionImagesBase64.length, "items");
    let currentModelImage = modelImageBase64;
    const stepResults = [];
    for (let i = 0; i < fashionImagesBase64.length; i++) {
      const fashionImageBase64 = fashionImagesBase64[i];
      const stepNumber = i + 1;
      const isFirstStep = i === 0;
      console.log(`Progressive step ${stepNumber}: Processing fashion item ${i + 1}`);
      try {
        const testResponse = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: ["Hello, are you working?"]
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
${isFirstStep ? "Take the fashion item from the second image and apply it to the person from the first image." : "Take the fashion item from the second image and add it to the person from the first image who already has fashion items applied from previous steps."}

SPECIFIC APPLICATION INSTRUCTIONS:
${stepInstructions}

${textPrompt ? `USER CREATIVE INSTRUCTIONS:
${textPrompt}

` : ""}PROFESSIONAL REQUIREMENTS:
- Make the new item fit naturally with proper shadows and lighting
- Create realistic fabric draping and movement
- Professional studio lighting and background
- Seamless integration with any existing clothing

VERIFICATION CHECK: If the result shows a different person, hair color, or facial features, the task has failed completely.`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: currentModelImage,
                mimeType: "image/jpeg"
              }
            },
            {
              inlineData: {
                data: fashionImageBase64,
                mimeType: "image/jpeg"
              }
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
      const imagePart = content.parts.find((part) => part.inlineData);
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
      currentModelImage = stepResultBase64;
      console.log(`Progressive step ${stepNumber} completed successfully`);
    }
    console.log("Progressive try-on generation completed successfully");
    return {
      success: true,
      resultImageUrl: await saveImageToFilesystem(currentModelImage, userId, "result"),
      // Final result
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

// server/services/imageAnalyzer.ts
import { GoogleGenAI as GoogleGenAI2 } from "@google/genai";
async function analyzeImageWithAI(imageBuffer) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("Google API key not found");
    }
    const ai2 = new GoogleGenAI2({ apiKey });
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
    const result = await ai2.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Image,
              mimeType: "image/jpeg"
            }
          }
        ]
      }]
    });
    const text2 = result.text || result.response?.text?.() || result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "Could not parse AI response";
    const jsonMatch = text2.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in AI response");
    }
    const analysis = JSON.parse(jsonMatch[0]);
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
    return {
      name: "Fashion Item",
      category: "Accessories",
      description: "Uploaded fashion item"
    };
  }
}

// server/services/emailVerification.ts
import crypto from "crypto";

// server/utils/replitmail.ts
import { z as z2 } from "zod";
var zSmtpMessage = z2.object({
  to: z2.union([z2.string().email(), z2.array(z2.string().email())]).describe("Recipient email address(es)"),
  cc: z2.union([z2.string().email(), z2.array(z2.string().email())]).optional().describe("CC recipient email address(es)"),
  subject: z2.string().describe("Email subject"),
  text: z2.string().optional().describe("Plain text body"),
  html: z2.string().optional().describe("HTML body"),
  attachments: z2.array(
    z2.object({
      filename: z2.string().describe("File name"),
      content: z2.string().describe("Base64 encoded content"),
      contentType: z2.string().optional().describe("MIME type"),
      encoding: z2.enum(["base64", "7bit", "quoted-printable", "binary"]).default("base64")
    })
  ).optional().describe("Email attachments")
});
function getAuthToken() {
  const xReplitToken = process.env.REPL_IDENTITY ? "repl " + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? "depl " + process.env.WEB_REPL_RENEWAL : null;
  if (!xReplitToken) {
    throw new Error(
      "No authentication token found. Please set REPL_IDENTITY or ensure you're running in Replit environment."
    );
  }
  return xReplitToken;
}
async function sendEmail(message) {
  const authToken = getAuthToken();
  const response = await fetch(
    "https://connectors.replit.com/api/v2/mailer/send",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X_REPLIT_TOKEN": authToken
      },
      body: JSON.stringify({
        to: message.to,
        cc: message.cc,
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: message.attachments
      })
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send email");
  }
  return await response.json();
}

// server/services/emailVerification.ts
function generateVerificationToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3);
  return {
    token,
    hashedToken,
    expiresAt
  };
}
function hashVerificationToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
async function sendVerificationEmail(email, username, verificationToken) {
  const baseUrl = process.env.REPLIT_DEPLOYMENT === "1" ? "https://fashionmirror.shop" : process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000";
  const verificationUrl = `${baseUrl}/verify-email/${verificationToken}`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        .content { padding: 30px 0; }
        .button { 
          display: inline-block; 
          padding: 15px 30px; 
          background-color: #2563eb; 
          color: white; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: bold;
          margin: 20px 0;
        }
        .footer { 
          margin-top: 30px; 
          padding-top: 20px; 
          border-top: 1px solid #f0f0f0; 
          font-size: 14px; 
          color: #666; 
        }
        .security { 
          background-color: #f8f9fa; 
          padding: 15px; 
          border-radius: 5px; 
          margin: 20px 0; 
          font-size: 14px; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">\u{1FA9E} FashionMirror</div>
        </div>
        
        <div class="content">
          <h2>Welcome to FashionMirror, ${username}!</h2>
          
          <p>Thank you for joining FashionMirror, the AI-powered virtual fashion try-on experience. To complete your registration and start exploring fashion with AI, please verify your email address.</p>
          
          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify My Email Address</a>
          </p>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">
            ${verificationUrl}
          </p>
          
          <div class="security">
            <strong>\u{1F512} Security Note:</strong><br>
            This verification link expires in 24 hours for your security. If you didn't create an account with FashionMirror, you can safely ignore this email.
          </div>
          
          <p>Once verified, you'll be able to:</p>
          <ul>
            <li>\u2728 Try on fashion items virtually using AI</li>
            <li>\u{1F457} Upload and manage your fashion collection</li>
            <li>\u{1F3AF} Experience step-by-step fashion transformations</li>
            <li>\u{1F916} Get AI-powered fashion recommendations</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>Best regards,<br>The FashionMirror Team</p>
          <p><em>Powered by Google Gemini 2.5 Flash Image AI</em></p>
        </div>
      </div>
    </body>
    </html>
  `;
  const textContent = `
Welcome to FashionMirror, ${username}!

Thank you for joining FashionMirror, the AI-powered virtual fashion try-on experience. To complete your registration and start exploring fashion with AI, please verify your email address.

Click this link to verify your email:
${verificationUrl}

This verification link expires in 24 hours for your security. If you didn't create an account with FashionMirror, you can safely ignore this email.

Once verified, you'll be able to:
\u2022 Try on fashion items virtually using AI
\u2022 Upload and manage your fashion collection  
\u2022 Experience step-by-step fashion transformations
\u2022 Get AI-powered fashion recommendations

Best regards,
The FashionMirror Team

Powered by Google Gemini 2.5 Flash Image AI
  `;
  const message = {
    to: email,
    subject: "\u{1FA9E} Welcome to FashionMirror - Verify Your Email",
    html: htmlContent,
    text: textContent
  };
  try {
    const result = await sendEmail(message);
    console.log(`Verification email sent successfully to ${email}:`, result.accepted);
  } catch (error) {
    console.error(`Failed to send verification email to ${email}:`, error);
    throw new Error("Failed to send verification email. Please try again.");
  }
}
async function sendWelcomeEmail(email, username) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        .content { padding: 30px 0; }
        .feature { 
          background-color: #f8f9fa; 
          padding: 15px; 
          border-radius: 8px; 
          margin: 10px 0; 
        }
        .footer { 
          margin-top: 30px; 
          padding-top: 20px; 
          border-top: 1px solid #f0f0f0; 
          font-size: 14px; 
          color: #666; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">\u{1FA9E} FashionMirror</div>
        </div>
        
        <div class="content">
          <h2>\u{1F389} Welcome to FashionMirror, ${username}!</h2>
          
          <p>Your email has been verified successfully! You're now ready to explore the future of fashion with AI-powered virtual try-ons.</p>
          
          <h3>\u{1F680} Get Started:</h3>
          
          <div class="feature">
            <strong>1. Upload Your Photo</strong><br>
            Start by uploading a clear photo of yourself to see how different outfits look on you.
          </div>
          
          <div class="feature">
            <strong>2. Browse Fashion Collection</strong><br>
            Explore our curated collection or upload your own fashion items with AI auto-categorization.
          </div>
          
          <div class="feature">
            <strong>3. Experience AI Try-On</strong><br>
            Watch as AI progressively applies fashion items with real-time status updates.
          </div>
          
          <p>Your FashionMirror account is now active and ready to use. Log in anytime to continue your fashion journey!</p>
        </div>
        
        <div class="footer">
          <p>Happy styling!<br>The FashionMirror Team</p>
          <p><em>Powered by Google Gemini 2.5 Flash Image AI</em></p>
        </div>
      </div>
    </body>
    </html>
  `;
  const textContent = `
\u{1F389} Welcome to FashionMirror, ${username}!

Your email has been verified successfully! You're now ready to explore the future of fashion with AI-powered virtual try-ons.

\u{1F680} Get Started:

1. Upload Your Photo
   Start by uploading a clear photo of yourself to see how different outfits look on you.

2. Browse Fashion Collection  
   Explore our curated collection or upload your own fashion items with AI auto-categorization.

3. Experience AI Try-On
   Watch as AI progressively applies fashion items with real-time status updates.

Your FashionMirror account is now active and ready to use. Log in anytime to continue your fashion journey!

Happy styling!
The FashionMirror Team

Powered by Google Gemini 2.5 Flash Image AI
  `;
  const message = {
    to: email,
    subject: "\u{1F389} Welcome to FashionMirror - You're All Set!",
    html: htmlContent,
    text: textContent
  };
  try {
    const result = await sendEmail(message);
    console.log(`Welcome email sent successfully to ${email}:`, result.accepted);
  } catch (error) {
    console.error(`Failed to send welcome email to ${email}:`, error);
  }
}

// server/middleware/auth.ts
async function requireAuth(req, res, next) {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({
        error: "Authentication required. Please log in to access this resource."
      });
    }
    const storage = await getStorage();
    const user = await storage.getUser(userId);
    if (!user) {
      req.session.destroy((err) => {
        if (err) console.error("Session destroy error:", err);
      });
      return res.status(401).json({
        error: "Invalid session. Please log in again."
      });
    }
    if (user.isVerified !== "true") {
      return res.status(401).json({
        error: "Please verify your email address before accessing this resource."
      });
    }
    const { password: _, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    res.status(500).json({
      error: "Authentication service temporarily unavailable."
    });
  }
}
async function optionalAuth(req, res, next) {
  try {
    const userId = req.session?.userId;
    if (userId) {
      const storage = await getStorage();
      const user = await storage.getUser(userId);
      if (user && user.isVerified === "true") {
        const { password: _, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
      }
    }
    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    next();
  }
}

// server/routes.ts
import multer from "multer";
import bcrypt2 from "bcrypt";
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});
function validateTextPrompt(textPrompt) {
  if (!textPrompt || typeof textPrompt !== "string") {
    return void 0;
  }
  const sanitized = textPrompt.trim();
  if (sanitized.length === 0) {
    return void 0;
  }
  if (sanitized.length > 500) {
    throw new Error("Text prompt must be 500 characters or less");
  }
  return sanitized;
}
async function registerRoutes(app2) {
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const validationResult = registerUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validationResult.error.errors
        });
      }
      const { username, email, password } = validationResult.data;
      const storage = await getStorage();
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "User with this email already exists" });
      }
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(409).json({ error: "Username already taken" });
      }
      const saltRounds = 12;
      const hashedPassword = await bcrypt2.hash(password, saltRounds);
      const verificationData = generateVerificationToken();
      const newUser = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role: "user",
        isVerified: "false",
        verificationToken: verificationData.hashedToken,
        verificationTokenExpires: verificationData.expiresAt
      });
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
  app2.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email is required" });
      }
      const storage = await getStorage();
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(200).json({
          message: "If an account with this email exists and is unverified, a new verification email has been sent."
        });
      }
      if (user.isVerified === "true") {
        return res.status(400).json({
          error: "This account is already verified. Please try logging in."
        });
      }
      const verificationData = generateVerificationToken();
      await storage.updateUserVerificationToken(user.id, verificationData.hashedToken, verificationData.expiresAt);
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
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const validationResult = loginUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validationResult.error.errors
        });
      }
      const { email, password } = validationResult.data;
      const storage = await getStorage();
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      if (user.isVerified !== "true") {
        return res.status(401).json({
          error: "Please verify your email address before logging in. Check your email for a verification link.",
          requiresVerification: true,
          email: user.email
        });
      }
      const isValidPassword = await bcrypt2.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ error: "Failed to create secure session" });
        }
        req.session.userId = user.id;
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
  app2.get("/api/auth/verify/:token", async (req, res) => {
    try {
      const { token } = req.params;
      if (!token || typeof token !== "string" || token.length < 10) {
        return res.status(400).json({ error: "Invalid verification token format" });
      }
      const hashedToken = hashVerificationToken(token);
      const storage = await getStorage();
      const user = await storage.getUserByVerificationToken(hashedToken);
      if (!user) {
        return res.status(400).json({
          error: "Invalid or expired verification token. Please request a new verification email."
        });
      }
      if (user.verificationTokenExpires && /* @__PURE__ */ new Date() > user.verificationTokenExpires) {
        return res.status(400).json({
          error: "Verification token has expired. Please register again or request a new verification email."
        });
      }
      if (user.isVerified === "true") {
        return res.status(200).json({
          message: "Email already verified. You can now log in.",
          alreadyVerified: true
        });
      }
      const verifiedUser = await storage.updateUserVerification(user.id, "true", true);
      try {
        await sendWelcomeEmail(user.email, user.username);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }
      res.status(200).json({
        message: "Email verified successfully! You can now log in to your account.",
        verified: true
      });
    } catch (error) {
      console.error("Error during email verification:", error);
      if (error instanceof Error) {
        if (error.message.includes("database") || error.message.includes("connection")) {
          return res.status(503).json({ error: "Service temporarily unavailable. Please try again later." });
        }
      }
      res.status(500).json({ error: "Failed to verify email. Please try again or contact support." });
    }
  });
  app2.get("/verify-email/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const storage = await getStorage();
      if (!token || typeof token !== "string" || token.length < 10) {
        return res.redirect(`/?verification=invalid`);
      }
      const hashedToken = hashVerificationToken(token);
      const user = await storage.getUserByVerificationToken(hashedToken);
      if (!user) {
        return res.redirect(`/?verification=invalid`);
      }
      if (user.verificationTokenExpires && /* @__PURE__ */ new Date() > user.verificationTokenExpires) {
        return res.redirect(`/?verification=expired`);
      }
      if (user.isVerified === "true") {
        return res.redirect(`/?verification=already-verified`);
      }
      await storage.updateUserVerification(user.id, "true", true);
      try {
        await sendWelcomeEmail(user.email, user.username);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }
      res.redirect(`/?verification=success&email=${encodeURIComponent(user.email)}`);
    } catch (error) {
      console.error("Error in verification page:", error);
      if (error instanceof Error && error.message.includes("database")) {
        return res.redirect(`/?verification=service-error`);
      }
      res.redirect(`/?verification=error`);
    }
  });
  app2.get("/api/auth/me", requireAuth, async (req, res) => {
    res.json({
      user: req.user
    });
  });
  app2.post("/api/auth/logout", async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("fashionmirror.sid");
      res.json({ message: "Logout successful" });
    });
  });
  app2.get("/api/fashion-items", optionalAuth, async (req, res) => {
    try {
      const storage = await getStorage();
      const userId = req.user?.id;
      const items = await storage.getFashionItems(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching fashion items:", error);
      res.status(500).json({ error: "Failed to fetch fashion items" });
    }
  });
  app2.get("/api/fashion-items/category/:category", optionalAuth, async (req, res) => {
    try {
      const { category } = req.params;
      const storage = await getStorage();
      const userId = req.user?.id;
      const items = await storage.getFashionItemsByCategory(category, userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching fashion items by category:", error);
      res.status(500).json({ error: "Failed to fetch fashion items" });
    }
  });
  app2.get("/api/try-on-results", requireAuth, async (req, res) => {
    try {
      const storage = await getStorage();
      const results = await storage.getTryOnResultsByUserId(req.user.id);
      res.json(results);
    } catch (error) {
      console.error("Error fetching try-on results:", error);
      res.status(500).json({ error: "Failed to fetch try-on results" });
    }
  });
  app2.delete("/api/fashion-items/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "Fashion item ID is required" });
      }
      const storage = await getStorage();
      const success = await storage.deleteFashionItem(id, req.user.id);
      if (!success) {
        return res.status(404).json({ error: "Fashion item not found or you don't have permission to delete it" });
      }
      res.json({ success: true, message: "Fashion item deleted successfully" });
    } catch (error) {
      console.error("Error deleting fashion item:", error);
      res.status(500).json({ error: "Failed to delete fashion item" });
    }
  });
  app2.delete("/api/try-on-results/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "Try-on result ID is required" });
      }
      const storage = await getStorage();
      const success = await storage.deleteTryOnResult(id, req.user.id);
      if (!success) {
        return res.status(404).json({ error: "Try-on result not found or you don't have permission to delete it" });
      }
      res.json({ success: true, message: "Try-on result deleted successfully" });
    } catch (error) {
      console.error("Error deleting try-on result:", error);
      res.status(500).json({ error: "Failed to delete try-on result" });
    }
  });
  app2.post("/api/try-on/generate-batch", requireAuth, upload.array("files"), async (req, res) => {
    try {
      const files = req.files;
      const userId = req.user.id;
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      const modelImage = files[0];
      if (!modelImage.mimetype.startsWith("image/")) {
        return res.status(400).json({ error: "First file must be a model image" });
      }
      const fashionItems2 = [];
      const fashionImageFiles = files.slice(1);
      for (let i = 0; i < fashionImageFiles.length; i++) {
        const name = req.body[`fashionItems[${i}][name]`] || `Fashion Item ${i + 1}`;
        const category = req.body[`fashionItems[${i}][category]`] || "Custom";
        const source = req.body[`fashionItems[${i}][source]`] || "upload";
        const collectionId = req.body[`fashionItems[${i}][collectionId]`];
        fashionItems2.push({
          image: fashionImageFiles[i],
          name,
          category,
          source,
          collectionId
        });
      }
      if (fashionItems2.length === 0) {
        return res.status(400).json({ error: "At least one fashion item is required" });
      }
      let textPrompt;
      try {
        textPrompt = validateTextPrompt(req.body.textPrompt);
      } catch (validationError) {
        return res.status(400).json({
          error: validationError instanceof Error ? validationError.message : "Invalid text prompt"
        });
      }
      const modelImageBase64 = imageBufferToBase64(modelImage.buffer);
      const results = [];
      for (let i = 0; i < fashionItems2.length; i++) {
        const item = fashionItems2[i];
        try {
          const fashionImageBase64 = imageBufferToBase64(item.image.buffer);
          const result = await generateVirtualTryOn({
            modelImageBase64,
            fashionImageBase64,
            fashionItemName: item.name,
            fashionCategory: item.category,
            textPrompt,
            userId
          });
          if (result.success) {
            const modelImageUrl = `data:${modelImage.mimetype};base64,${modelImageBase64}`;
            const fashionImageUrl = `data:${item.image.mimetype};base64,${fashionImageBase64}`;
            const resultImageUrl = result.resultImageUrl;
            const storage = await getStorage();
            const tryOnResult = await storage.createTryOnResult({
              userId: userId || null,
              modelImageUrl,
              fashionImageUrl,
              resultImageUrl,
              fashionItemName: item.name,
              fashionCategory: item.category,
              metadata: {
                timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                batchIndex: i,
                totalItems: fashionItems2.length,
                modelImageSize: modelImage.size,
                fashionImageSize: item.image.size,
                textPrompt: textPrompt || void 0
              }
            });
            results.push(tryOnResult);
          }
        } catch (itemError) {
          console.error(`Error processing fashion item ${i}:`, itemError);
        }
      }
      res.json({
        success: true,
        results,
        completed: results.length,
        total: fashionItems2.length
      });
    } catch (error) {
      console.error("Error generating batch virtual try-on:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to generate batch try-on results"
      });
    }
  });
  app2.post("/api/try-on/generate-simultaneous", requireAuth, upload.array("files"), async (req, res) => {
    try {
      const files = req.files;
      const userId = req.user.id;
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      const modelImage = files[0];
      if (!modelImage.mimetype.startsWith("image/")) {
        return res.status(400).json({ error: "First file must be a model image" });
      }
      const fashionItems2 = [];
      const fashionImageFiles = files.slice(1);
      for (let i = 0; i < fashionImageFiles.length; i++) {
        const name = req.body[`fashionItems[${i}][name]`] || `Fashion Item ${i + 1}`;
        const category = req.body[`fashionItems[${i}][category]`] || "Custom";
        const source = req.body[`fashionItems[${i}][source]`] || "upload";
        const collectionId = req.body[`fashionItems[${i}][collectionId]`];
        fashionItems2.push({
          image: fashionImageFiles[i],
          name,
          category,
          source,
          collectionId
        });
      }
      if (fashionItems2.length === 0) {
        return res.status(400).json({ error: "At least one fashion item is required" });
      }
      let textPrompt;
      try {
        textPrompt = validateTextPrompt(req.body.textPrompt);
      } catch (validationError) {
        return res.status(400).json({
          error: validationError instanceof Error ? validationError.message : "Invalid text prompt"
        });
      }
      const modelImageBase64 = imageBufferToBase64(modelImage.buffer);
      const fashionImagesBase64 = fashionItems2.map((item) => imageBufferToBase64(item.image.buffer));
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
      const modelImageUrl = `data:${modelImage.mimetype};base64,${modelImageBase64}`;
      const fashionImageUrls = fashionItems2.map(
        (item, index) => `data:${item.image.mimetype};base64,${fashionImagesBase64[index]}`
      );
      const resultImageUrl = result.resultImageUrl;
      const combinedFashionItemName = fashionItems2.map((item) => item.name).join(", ");
      const combinedFashionCategory = "Combined Outfit";
      const storage = await getStorage();
      const tryOnResult = await storage.createTryOnResult({
        userId: userId || null,
        modelImageUrl,
        fashionImageUrl: fashionImageUrls[0],
        // Use first item's URL for backward compatibility
        resultImageUrl,
        fashionItemName: combinedFashionItemName,
        fashionCategory: combinedFashionCategory,
        metadata: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          modelImageSize: modelImage.size,
          fashionImageSizes: fashionItems2.map((item) => item.image.size),
          fashionImageUrls,
          // Store all fashion image URLs
          fashionItems: fashionItems2.map((item) => ({
            name: item.name,
            category: item.category,
            source: item.source,
            collectionId: item.collectionId
          })),
          generationType: "simultaneous",
          textPrompt: textPrompt || void 0
        }
      });
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
  app2.post("/api/try-on/generate-step", requireAuth, upload.fields([
    { name: "modelImage", maxCount: 1 },
    { name: "fashionImage", maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files;
      const { fashionItemName, fashionCategory, stepNumber } = req.body;
      let textPrompt;
      try {
        textPrompt = validateTextPrompt(req.body.textPrompt);
      } catch (validationError) {
        return res.status(400).json({
          error: validationError instanceof Error ? validationError.message : "Invalid text prompt"
        });
      }
      const userId = req.user.id;
      if (!files.modelImage || !files.fashionImage) {
        return res.status(400).json({ error: "Both model and fashion images are required" });
      }
      if (!fashionItemName || !fashionCategory) {
        return res.status(400).json({ error: "Fashion item name and category are required" });
      }
      const modelImage = files.modelImage[0];
      const fashionImage = files.fashionImage[0];
      console.log(`Generating step ${stepNumber || "1"}: Processing ${fashionItemName}`);
      console.log(`TextPrompt received: ${textPrompt ? `"${textPrompt}"` : "undefined/empty"}`);
      const modelImageBase64 = imageBufferToBase64(modelImage.buffer);
      const fashionImageBase64 = imageBufferToBase64(fashionImage.buffer);
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
      console.log(`Step ${stepNumber || "1"} completed successfully`);
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
  app2.post("/api/try-on/generate-progressive", requireAuth, upload.array("files"), async (req, res) => {
    try {
      const files = req.files;
      const userId = req.user.id;
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      const modelImage = files[0];
      if (!modelImage.mimetype.startsWith("image/")) {
        return res.status(400).json({ error: "First file must be a model image" });
      }
      const fashionItems2 = [];
      const fashionImageFiles = files.slice(1);
      for (let i = 0; i < fashionImageFiles.length; i++) {
        const name = req.body[`fashionItems[${i}][name]`] || `Fashion Item ${i + 1}`;
        const category = req.body[`fashionItems[${i}][category]`] || "Custom";
        const source = req.body[`fashionItems[${i}][source]`] || "upload";
        const collectionId = req.body[`fashionItems[${i}][collectionId]`];
        fashionItems2.push({
          image: fashionImageFiles[i],
          name,
          category,
          source,
          collectionId
        });
      }
      if (fashionItems2.length === 0) {
        return res.status(400).json({ error: "At least one fashion item is required" });
      }
      let textPrompt;
      try {
        textPrompt = validateTextPrompt(req.body.textPrompt);
      } catch (validationError) {
        return res.status(400).json({
          error: validationError instanceof Error ? validationError.message : "Invalid text prompt"
        });
      }
      const modelImageBase64 = imageBufferToBase64(modelImage.buffer);
      const fashionImagesBase64 = fashionItems2.map((item) => imageBufferToBase64(item.image.buffer));
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
      const modelImageUrl = `data:${modelImage.mimetype};base64,${modelImageBase64}`;
      const fashionImageUrls = fashionItems2.map(
        (item, index) => `data:${item.image.mimetype};base64,${fashionImagesBase64[index]}`
      );
      const resultImageUrl = result.resultImageUrl;
      const combinedFashionItemName = fashionItems2.map((item) => item.name).join(", ");
      const combinedFashionCategory = "Progressive Outfit";
      const storage = await getStorage();
      const tryOnResult = await storage.createTryOnResult({
        userId: userId || null,
        modelImageUrl,
        fashionImageUrl: fashionImageUrls[0],
        // Use first item's URL for backward compatibility
        resultImageUrl,
        fashionItemName: combinedFashionItemName,
        fashionCategory: combinedFashionCategory,
        metadata: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          modelImageSize: modelImage.size,
          fashionImageSizes: fashionItems2.map((item) => item.image.size),
          fashionImageUrls,
          fashionItems: fashionItems2.map((item) => ({
            name: item.name,
            category: item.category,
            source: item.source,
            collectionId: item.collectionId
          })),
          generationType: "progressive",
          stepResults: result.stepResults,
          // Store intermediate results
          textPrompt: textPrompt || void 0
        }
      });
      res.json({
        success: true,
        result: tryOnResult,
        stepResults: result.stepResults
        // Include intermediate step images
      });
    } catch (error) {
      console.error("Error generating progressive virtual try-on:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to generate progressive try-on result"
      });
    }
  });
  app2.post("/api/try-on/generate", requireAuth, upload.fields([
    { name: "modelImage", maxCount: 1 },
    { name: "fashionImage", maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files;
      const { fashionItemName, fashionCategory } = req.body;
      let textPrompt;
      try {
        textPrompt = validateTextPrompt(req.body.textPrompt);
      } catch (validationError) {
        return res.status(400).json({
          error: validationError instanceof Error ? validationError.message : "Invalid text prompt"
        });
      }
      const userId = req.user.id;
      if (!files.modelImage || !files.fashionImage) {
        return res.status(400).json({ error: "Both model and fashion images are required" });
      }
      if (!fashionItemName || !fashionCategory) {
        return res.status(400).json({ error: "Fashion item name and category are required" });
      }
      const modelImage = files.modelImage[0];
      const fashionImage = files.fashionImage[0];
      const modelImageBase64 = imageBufferToBase64(modelImage.buffer);
      const fashionImageBase64 = imageBufferToBase64(fashionImage.buffer);
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
      const modelImageUrl = `data:${modelImage.mimetype};base64,${modelImageBase64}`;
      const fashionImageUrl = `data:${fashionImage.mimetype};base64,${fashionImageBase64}`;
      const resultImageUrl = result.resultImageUrl;
      const storage = await getStorage();
      const tryOnResult = await storage.createTryOnResult({
        userId: userId || null,
        modelImageUrl,
        fashionImageUrl,
        resultImageUrl,
        fashionItemName,
        fashionCategory,
        metadata: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          modelImageSize: modelImage.size,
          fashionImageSize: fashionImage.size,
          textPrompt: textPrompt || void 0
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
  app2.get("/api/fashion-items/:id", async (req, res) => {
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
  app2.post("/api/fashion-items/analyze", upload.single("image"), async (req, res) => {
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
  app2.post("/api/fashion-items", requireAuth, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      const { name, category, description } = req.body;
      if (!name || !category) {
        return res.status(400).json({ error: "Name and category are required" });
      }
      const imageBase64 = imageBufferToBase64(req.file.buffer);
      const imageUrl = `data:image/jpeg;base64,${imageBase64}`;
      const storage = await getStorage();
      const newItem = await storage.createFashionItem({
        name,
        category,
        imageUrl,
        description: description || `User uploaded: ${name}`,
        userId: req.user.id,
        // Use authenticated user's ID
        isShared: "false"
        // User uploaded items are private to the user
      });
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error saving fashion item:", error);
      res.status(500).json({ error: "Failed to save fashion item" });
    }
  });
  app2.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      geminiApiKey: !!process.env.GEMINI_API_KEY
    });
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/routes/media.ts
import { createReadStream } from "fs";
import fs2 from "fs/promises";
import path2 from "path";
function sanitizePath(inputPath, baseDir) {
  try {
    const normalized = path2.normalize(inputPath);
    const resolved = path2.resolve(baseDir, normalized);
    if (!resolved.startsWith(path2.resolve(baseDir))) {
      return null;
    }
    return resolved;
  } catch {
    return null;
  }
}
function getMimeType(filePath) {
  const ext = path2.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif"
  };
  return mimeTypes[ext] || "application/octet-stream";
}
function registerMediaRoutes(app2) {
  const mediaRoot = process.env.MEDIA_ROOT || path2.join(process.cwd(), "uploads");
  app2.get("/media/protected/*", requireAuth, async (req, res) => {
    try {
      const filePath = req.params[0];
      const fullPath = sanitizePath(filePath, path2.join(mediaRoot, "protected"));
      if (!fullPath) {
        return res.status(400).json({ error: "Invalid file path" });
      }
      const pathParts = filePath.split("/");
      if (pathParts.length < 3) {
        return res.status(400).json({ error: "Invalid protected file path" });
      }
      const [type, pathUserId] = pathParts;
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (pathUserId !== currentUserId) {
        return res.status(403).json({ error: "Access denied: You can only access your own files" });
      }
      const stats = await fs2.stat(fullPath);
      if (!stats.isFile()) {
        return res.status(404).json({ error: "File not found" });
      }
      res.set({
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        "Content-Type": getMimeType(fullPath),
        "Content-Length": stats.size.toString()
      });
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        const chunksize = end - start + 1;
        res.status(206).set({
          "Content-Range": `bytes ${start}-${end}/${stats.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize.toString()
        });
        const stream = createReadStream(fullPath, { start, end });
        stream.pipe(res);
      } else {
        const stream = createReadStream(fullPath);
        stream.pipe(res);
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        return res.status(404).json({ error: "File not found" });
      }
      console.error("Error serving protected media:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}

// server/vite.ts
import express from "express";
import fs3 from "fs";
import path4 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path3 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path3.resolve(import.meta.dirname, "client", "src"),
      "@shared": path3.resolve(import.meta.dirname, "shared"),
      "@assets": path3.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path3.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path3.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path4.resolve(import.meta.dirname, "..", "dist", "public");
  if (!fs3.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    service: "FashionMirror API"
  });
});
app.head("/", (_req, res) => {
  res.status(200).end();
});
app.get("/", (_req, res) => {
  res.status(200).json({
    message: "FashionMirror API is running",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
var PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({
    conObject: {
      connectionString: process.env.DATABASE_URL
    },
    tableName: "session",
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || "development-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    // Allow non-HTTPS in Replit deployment
    httpOnly: true,
    maxAge: 1e3 * 60 * 60 * 24 * 7,
    // 7 days
    sameSite: "lax"
    // Less restrictive for deployment compatibility
  },
  name: "fashionmirror.sid"
}));
app.use((req, res, next) => {
  const start = Date.now();
  const path6 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path6.startsWith("/api")) {
      let logLine = `${req.method} ${path6} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const mediaRoot = process.env.MEDIA_ROOT || path5.join(process.cwd(), "uploads");
  app.use("/media/public", express2.static(path5.join(mediaRoot, "public"), {
    maxAge: "7d",
    etag: true,
    setHeaders: (res) => {
      res.set("X-Content-Type-Options", "nosniff");
    }
  }));
  registerMediaRoutes(app);
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
