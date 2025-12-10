import {
  type User, type InsertUser,
  type TryOnResult, type InsertTryOnResult,
  type FashionItem, type InsertFashionItem,
  type WidgetSession, type InsertWidgetSession,
  type WidgetAnalytics, type InsertWidgetAnalytics,
  users, tryOnResults, fashionItems,
  widgetSessions, widgetAnalytics
} from "@shared/schema";
import { randomUUID, randomBytes } from "crypto";
import bcrypt from "bcrypt";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, or, and, sql, desc } from "drizzle-orm";

// Helper to generate API keys
function generateApiKey(prefix: string): string {
  return `${prefix}${randomBytes(24).toString("base64url")}`;
}

// Helper to generate webhook secret
function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("base64url")}`;
}

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByApiKey(apiKey: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getUserByVerificationToken(hashedToken: string): Promise<User | undefined>;
  updateUserVerification(id: string, isVerified: string, clearToken?: boolean): Promise<User>;
  updateUserVerificationToken(id: string, hashedToken: string, expiresAt: Date): Promise<User>;
  updateUserApiKeys(id: string, liveKey: string, testKey: string): Promise<User | undefined>;
  incrementUserQuota(id: string): Promise<void>;
  incrementStudioQuota(id: string): Promise<void>;
  incrementWidgetQuota(id: string): Promise<void>;
  resetUserQuota(id: string, resetAt: Date): Promise<void>;

  // Try-on result methods
  getTryOnResult(id: string): Promise<TryOnResult | undefined>;
  getTryOnResultsByUserId(userId: string): Promise<TryOnResult[]>;
  createTryOnResult(result: InsertTryOnResult): Promise<TryOnResult>;
  deleteTryOnResult(id: string, userId: string): Promise<boolean>;

  // Fashion item methods
  getFashionItem(id: string): Promise<FashionItem | undefined>;
  getFashionItems(userId?: string): Promise<FashionItem[]>;
  getFashionItemsByCategory(category: string, userId?: string): Promise<FashionItem[]>;
  createFashionItem(item: InsertFashionItem): Promise<FashionItem>;
  deleteFashionItem(id: string, userId: string): Promise<boolean>;

  // Widget session methods
  getWidgetSession(id: string): Promise<WidgetSession | undefined>;
  getWidgetSessionsByUser(userId: string, limit?: number): Promise<WidgetSession[]>;
  createWidgetSession(session: InsertWidgetSession): Promise<WidgetSession>;
  updateWidgetSession(id: string, updates: Partial<WidgetSession>): Promise<WidgetSession | undefined>;
  deleteWidgetSession(id: string): Promise<boolean>;

  // Widget analytics methods
  createWidgetAnalytics(analytics: InsertWidgetAnalytics): Promise<WidgetAnalytics>;
  getWidgetAnalyticsByUser(userId: string, startDate?: Date, endDate?: Date): Promise<WidgetAnalytics[]>;
  deleteWidgetAnalyticsBySession(sessionId: string): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private tryOnResults: Map<string, TryOnResult>;
  private fashionItems: Map<string, FashionItem>;

  constructor() {
    this.users = new Map();
    this.tryOnResults = new Map();
    this.fashionItems = new Map();
    
    // Initialize with some default fashion items
    this.initializeFashionItems();
    
    // Initialize with default admin user
    this.initializeDefaultAdmin();
  }

  private initializeFashionItems() {
    const defaultItems: InsertFashionItem[] = [
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
        imageUrl: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
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

    defaultItems.forEach(item => {
      const id = randomUUID();
      const fashionItem: FashionItem = {
        ...item,
        id,
        description: item.description || null,
        userId: null, // Default items are shared
        isShared: "true", // Default items are available to all users
        createdAt: new Date()
      };
      this.fashionItems.set(id, fashionItem);
    });
  }

  private async initializeDefaultAdmin() {
    // Check if admin user already exists
    const existingAdmin = await this.getUserByEmail("admin");
    if (existingAdmin) {
      return; // Admin already exists
    }

    // Create default admin user with specified credentials
    const adminId = randomUUID();
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash("W3lcome1!", saltRounds);

    const adminUser: User = {
      id: adminId,
      username: "admin",
      email: "admin", // Using "admin" as email since it's specified as the login
      password: hashedPassword,
      role: "admin",
      isVerified: "true",
      verificationToken: null,
      verificationTokenExpires: null,
      // API keys and quota fields
      liveKey: generateApiKey("mk_live_"),
      testKey: generateApiKey("mk_test_"),
      apiKeys: [],
      allowedDomains: ['fashionmirror.shop'],
      plan: "free",
      totalQuota: 100,
      monthlyQuota: null,
      quotaUsed: 0,
      studioQuotaUsed: 0,
      widgetQuotaUsed: 0,
      quotaResetAt: null,
      webhookUrl: null,
      webhookSecret: generateWebhookSecret(),
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(adminId, adminUser);
    console.log("Default admin user created: admin / W3lcome1!");
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByApiKey(apiKey: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.liveKey === apiKey || user.testKey === apiKey,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "user",
      isVerified: insertUser.isVerified || "false",
      verificationToken: insertUser.verificationToken || null,
      verificationTokenExpires: insertUser.verificationTokenExpires || null,
      // API keys - generate if not provided
      liveKey: insertUser.liveKey || generateApiKey("mk_live_"),
      testKey: insertUser.testKey || generateApiKey("mk_test_"),
      apiKeys: insertUser.apiKeys || [],
      allowedDomains: insertUser.allowedDomains || ['fashionmirror.shop'],
      plan: insertUser.plan || "free",
      totalQuota: insertUser.totalQuota ?? 100,
      monthlyQuota: insertUser.monthlyQuota ?? null,
      quotaUsed: insertUser.quotaUsed ?? 0,
      studioQuotaUsed: insertUser.studioQuotaUsed ?? 0,
      widgetQuotaUsed: insertUser.widgetQuotaUsed ?? 0,
      quotaResetAt: insertUser.quotaResetAt ?? null,
      webhookUrl: insertUser.webhookUrl ?? null,
      webhookSecret: insertUser.webhookSecret || generateWebhookSecret(),
      settings: insertUser.settings || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUserByVerificationToken(hashedToken: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.verificationToken === hashedToken && 
                user.verificationTokenExpires && 
                user.verificationTokenExpires > new Date()
    );
  }

  async updateUserVerification(id: string, isVerified: string, clearToken = true): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser: User = {
      ...user,
      isVerified,
      verificationToken: clearToken ? null : user.verificationToken,
      verificationTokenExpires: clearToken ? null : user.verificationTokenExpires,
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserVerificationToken(id: string, hashedToken: string, expiresAt: Date): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser: User = {
      ...user,
      verificationToken: hashedToken,
      verificationTokenExpires: expiresAt,
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserApiKeys(id: string, liveKey: string, testKey: string): Promise<User | undefined> {
    return this.updateUser(id, { liveKey, testKey });
  }

  async incrementUserQuota(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.quotaUsed = (user.quotaUsed ?? 0) + 1;
      user.updatedAt = new Date();
      this.users.set(id, user);
    }
  }

  async incrementStudioQuota(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.quotaUsed = (user.quotaUsed ?? 0) + 1;
      user.studioQuotaUsed = (user.studioQuotaUsed ?? 0) + 1;
      user.updatedAt = new Date();
      this.users.set(id, user);
    }
  }

  async incrementWidgetQuota(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.quotaUsed = (user.quotaUsed ?? 0) + 1;
      user.widgetQuotaUsed = (user.widgetQuotaUsed ?? 0) + 1;
      user.updatedAt = new Date();
      this.users.set(id, user);
    }
  }

  async resetUserQuota(id: string, resetAt: Date): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.quotaUsed = 0;
      user.studioQuotaUsed = 0;
      user.widgetQuotaUsed = 0;
      user.quotaResetAt = resetAt;
      user.updatedAt = new Date();
      this.users.set(id, user);
    }
  }

  async getTryOnResult(id: string): Promise<TryOnResult | undefined> {
    return this.tryOnResults.get(id);
  }

  async getTryOnResultsByUserId(userId: string): Promise<TryOnResult[]> {
    const results = Array.from(this.tryOnResults.values()).filter(
      (result) => result.userId === userId,
    );
    // Sort by creation date (newest first) and limit to 20
    // Exclude large image data for gallery view to prevent response size issues
    return results
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)
      .map(result => ({
        ...result,
        resultImageBase64: '', // Clear heavy image data for gallery
        modelImageBase64: ''   // Clear heavy image data for gallery
      }));
  }

  async createTryOnResult(insertResult: InsertTryOnResult): Promise<TryOnResult> {
    const id = randomUUID();
    const result: TryOnResult = {
      ...insertResult,
      id,
      userId: insertResult.userId || null,
      metadata: insertResult.metadata || null,
      createdAt: new Date()
    };
    this.tryOnResults.set(id, result);
    return result;
  }

  async getFashionItem(id: string): Promise<FashionItem | undefined> {
    return this.fashionItems.get(id);
  }

  async getFashionItems(userId?: string): Promise<FashionItem[]> {
    const allItems = Array.from(this.fashionItems.values());
    
    if (!userId) {
      // Return only shared items for non-authenticated users
      return allItems.filter(item => item.isShared === "true");
    }
    
    // Return shared items + user's personal items
    return allItems.filter(item => 
      item.isShared === "true" || item.userId === userId
    );
  }

  async getFashionItemsByCategory(category: string, userId?: string): Promise<FashionItem[]> {
    const allItems = Array.from(this.fashionItems.values());
    
    if (!userId) {
      // Return only shared items for non-authenticated users
      return allItems.filter(item => 
        item.category.toLowerCase() === category.toLowerCase() && 
        item.isShared === "true"
      );
    }
    
    // Return shared items + user's personal items in this category
    return allItems.filter(item => 
      item.category.toLowerCase() === category.toLowerCase() && 
      (item.isShared === "true" || item.userId === userId)
    );
  }

  async createFashionItem(insertItem: InsertFashionItem): Promise<FashionItem> {
    const id = randomUUID();
    const item: FashionItem = {
      ...insertItem,
      id,
      description: insertItem.description || null,
      userId: insertItem.userId ?? null,
      isShared: insertItem.isShared ?? "false",
      createdAt: new Date()
    };
    this.fashionItems.set(id, item);
    return item;
  }

  async deleteTryOnResult(id: string, userId: string): Promise<boolean> {
    const result = this.tryOnResults.get(id);
    if (!result) {
      return false;
    }
    
    // Check if user owns this result
    if (result.userId !== userId) {
      return false;
    }
    
    this.tryOnResults.delete(id);
    return true;
  }

  async deleteFashionItem(id: string, userId: string): Promise<boolean> {
    const item = this.fashionItems.get(id);
    if (!item) {
      return false;
    }

    // Check if user owns this item (users can only delete their own items, not shared items)
    if (item.userId !== userId) {
      return false;
    }

    this.fashionItems.delete(id);
    return true;
  }

  // Widget session methods
  private widgetSessionsMap: Map<string, WidgetSession> = new Map();
  private widgetAnalyticsMap: Map<number, WidgetAnalytics> = new Map();
  private analyticsIdCounter = 1;

  async getWidgetSession(id: string): Promise<WidgetSession | undefined> {
    return this.widgetSessionsMap.get(id);
  }

  async getWidgetSessionsByUser(userId: string, limit = 20): Promise<WidgetSession[]> {
    return Array.from(this.widgetSessionsMap.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async createWidgetSession(session: InsertWidgetSession): Promise<WidgetSession> {
    const newSession: WidgetSession = {
      id: session.id,
      userId: session.userId ?? null,
      productImage: session.productImage,
      productName: session.productName ?? null,
      productId: session.productId ?? null,
      productCategory: session.productCategory ?? null,
      productPrice: session.productPrice ?? null,
      productCurrency: session.productCurrency ?? null,
      productUrl: session.productUrl ?? null,
      externalUserId: session.externalUserId ?? null,
      userImage: session.userImage ?? null,
      status: session.status ?? "pending",
      resultImage: session.resultImage ?? null,
      resultThumbnail: session.resultThumbnail ?? null,
      processingTime: session.processingTime ?? null,
      errorCode: session.errorCode ?? null,
      errorMessage: session.errorMessage ?? null,
      originDomain: session.originDomain ?? null,
      userAgent: session.userAgent ?? null,
      ipAddress: session.ipAddress ?? null,
      createdAt: new Date(),
      completedAt: null,
      expiresAt: session.expiresAt ?? null,
    };
    this.widgetSessionsMap.set(session.id, newSession);
    return newSession;
  }

  async updateWidgetSession(id: string, updates: Partial<WidgetSession>): Promise<WidgetSession | undefined> {
    const session = this.widgetSessionsMap.get(id);
    if (!session) return undefined;

    const updated = { ...session, ...updates };
    this.widgetSessionsMap.set(id, updated);
    return updated;
  }

  async deleteWidgetSession(id: string): Promise<boolean> {
    return this.widgetSessionsMap.delete(id);
  }

  // Widget analytics methods
  async createWidgetAnalytics(analytics: InsertWidgetAnalytics): Promise<WidgetAnalytics> {
    const id = this.analyticsIdCounter++;
    const newAnalytics: WidgetAnalytics = {
      id,
      userId: analytics.userId ?? null,
      sessionId: analytics.sessionId ?? null,
      eventType: analytics.eventType,
      eventData: analytics.eventData ?? {},
      createdAt: new Date(),
    };
    this.widgetAnalyticsMap.set(id, newAnalytics);
    return newAnalytics;
  }

  async getWidgetAnalyticsByUser(userId: string, startDate?: Date, endDate?: Date): Promise<WidgetAnalytics[]> {
    return Array.from(this.widgetAnalyticsMap.values())
      .filter(a => {
        if (a.userId !== userId) return false;
        if (startDate && a.createdAt < startDate) return false;
        if (endDate && a.createdAt > endDate) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async deleteWidgetAnalyticsBySession(sessionId: string): Promise<number> {
    let count = 0;
    for (const [id, analytics] of this.widgetAnalyticsMap.entries()) {
      if (analytics.sessionId === sessionId) {
        this.widgetAnalyticsMap.delete(id);
        count++;
      }
    }
    return count;
  }
}

// Database storage implementation using Drizzle ORM
export class DatabaseStorage implements IStorage {
  private db;

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }

  async getUserByVerificationToken(hashedToken: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.verificationToken, hashedToken)).limit(1);
    return result[0];
  }

  async updateUserVerification(id: string, isVerified: string, clearToken?: boolean): Promise<User> {
    const updateData: any = { isVerified };
    if (clearToken) {
      updateData.verificationToken = null;
      updateData.verificationTokenExpires = null;
    }
    const result = await this.db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return result[0];
  }

  async updateUserVerificationToken(id: string, hashedToken: string, expiresAt: Date): Promise<User> {
    const result = await this.db.update(users).set({
      verificationToken: hashedToken,
      verificationTokenExpires: expiresAt
    }).where(eq(users.id, id)).returning();
    return result[0];
  }

  async getUserByApiKey(apiKey: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(
      or(
        eq(users.liveKey, apiKey),
        eq(users.testKey, apiKey)
      )
    ).limit(1);
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await this.db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateUserApiKeys(id: string, liveKey: string, testKey: string): Promise<User | undefined> {
    return this.updateUser(id, { liveKey, testKey });
  }

  async incrementUserQuota(id: string): Promise<void> {
    await this.db.update(users)
      .set({ quotaUsed: sql`${users.quotaUsed} + 1` })
      .where(eq(users.id, id));
  }

  async incrementStudioQuota(id: string): Promise<void> {
    await this.db.update(users)
      .set({
        quotaUsed: sql`${users.quotaUsed} + 1`,
        studioQuotaUsed: sql`COALESCE(${users.studioQuotaUsed}, 0) + 1`
      })
      .where(eq(users.id, id));
  }

  async incrementWidgetQuota(id: string): Promise<void> {
    await this.db.update(users)
      .set({
        quotaUsed: sql`${users.quotaUsed} + 1`,
        widgetQuotaUsed: sql`COALESCE(${users.widgetQuotaUsed}, 0) + 1`
      })
      .where(eq(users.id, id));
  }

  async resetUserQuota(id: string, resetAt: Date): Promise<void> {
    await this.db.update(users)
      .set({ quotaUsed: 0, studioQuotaUsed: 0, widgetQuotaUsed: 0, quotaResetAt: resetAt })
      .where(eq(users.id, id));
  }

  async getTryOnResult(id: string): Promise<TryOnResult | undefined> {
    const result = await this.db.select().from(tryOnResults).where(eq(tryOnResults.id, id)).limit(1);
    return result[0];
  }

  async getTryOnResultsByUserId(userId: string): Promise<TryOnResult[]> {
    // Get all fields but replace heavy image data with empty strings for gallery
    const results = await this.db.select().from(tryOnResults)
      .where(eq(tryOnResults.userId, userId))
      .orderBy(desc(tryOnResults.createdAt))
      .limit(20);
    
    // Strip out heavy base64 image data for gallery display to prevent response size issues
    return results.map(result => ({
      ...result,
      modelImageUrl: result.modelImageUrl.length > 1000 ? '' : result.modelImageUrl,
      fashionImageUrl: result.fashionImageUrl.length > 1000 ? '' : result.fashionImageUrl,
      resultImageUrl: result.resultImageUrl.length > 1000 ? '' : result.resultImageUrl
    }));
  }

  async createTryOnResult(result: InsertTryOnResult): Promise<TryOnResult> {
    const insertResult = await this.db.insert(tryOnResults).values(result).returning();
    return insertResult[0];
  }

  async getFashionItem(id: string): Promise<FashionItem | undefined> {
    const result = await this.db.select().from(fashionItems).where(eq(fashionItems.id, id)).limit(1);
    return result[0];
  }

  async getFashionItems(userId?: string): Promise<FashionItem[]> {
    if (!userId) {
      // Return only shared items for non-authenticated users
      return await this.db.select().from(fashionItems).where(eq(fashionItems.isShared, "true"));
    }
    
    // Return shared items + user's personal items
    return await this.db.select().from(fashionItems).where(
      or(
        eq(fashionItems.isShared, "true"),
        eq(fashionItems.userId, userId)
      )
    );
  }

  async getFashionItemsByCategory(category: string, userId?: string): Promise<FashionItem[]> {
    if (!userId) {
      // Return only shared items for non-authenticated users
      return await this.db.select().from(fashionItems).where(
        and(
          eq(fashionItems.category, category),
          eq(fashionItems.isShared, "true")
        )
      );
    }
    
    // Return shared items + user's personal items in this category
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

  async createFashionItem(item: InsertFashionItem): Promise<FashionItem> {
    const result = await this.db.insert(fashionItems).values(item).returning();
    return result[0];
  }

  async deleteTryOnResult(id: string, userId: string): Promise<boolean> {
    const result = await this.db.delete(tryOnResults).where(
      and(
        eq(tryOnResults.id, id),
        eq(tryOnResults.userId, userId)
      )
    ).returning();
    
    return result.length > 0;
  }

  async deleteFashionItem(id: string, userId: string): Promise<boolean> {
    const result = await this.db.delete(fashionItems).where(
      and(
        eq(fashionItems.id, id),
        eq(fashionItems.userId, userId)
      )
    ).returning();

    return result.length > 0;
  }

  // Widget session methods
  async getWidgetSession(id: string): Promise<WidgetSession | undefined> {
    const result = await this.db.select().from(widgetSessions).where(eq(widgetSessions.id, id)).limit(1);
    return result[0];
  }

  async getWidgetSessionsByUser(userId: string, limit = 20): Promise<WidgetSession[]> {
    return await this.db.select().from(widgetSessions)
      .where(eq(widgetSessions.userId, userId))
      .orderBy(desc(widgetSessions.createdAt))
      .limit(limit);
  }

  async createWidgetSession(session: InsertWidgetSession): Promise<WidgetSession> {
    const result = await this.db.insert(widgetSessions).values(session).returning();
    return result[0];
  }

  async updateWidgetSession(id: string, updates: Partial<WidgetSession>): Promise<WidgetSession | undefined> {
    const result = await this.db.update(widgetSessions)
      .set(updates)
      .where(eq(widgetSessions.id, id))
      .returning();
    return result[0];
  }

  async deleteWidgetSession(id: string): Promise<boolean> {
    const result = await this.db.delete(widgetSessions)
      .where(eq(widgetSessions.id, id))
      .returning();
    return result.length > 0;
  }

  // Widget analytics methods
  async createWidgetAnalytics(analytics: InsertWidgetAnalytics): Promise<WidgetAnalytics> {
    const result = await this.db.insert(widgetAnalytics).values(analytics).returning();
    return result[0];
  }

  async getWidgetAnalyticsByUser(userId: string, startDate?: Date, endDate?: Date): Promise<WidgetAnalytics[]> {
    let query = this.db.select().from(widgetAnalytics)
      .where(eq(widgetAnalytics.userId, userId))
      .orderBy(desc(widgetAnalytics.createdAt));

    // Note: For date filtering, we'd need to add additional where clauses
    // This is a simplified version - in production, use proper date filtering
    return await query;
  }

  async deleteWidgetAnalyticsBySession(sessionId: string): Promise<number> {
    const result = await this.db.delete(widgetAnalytics)
      .where(eq(widgetAnalytics.sessionId, sessionId))
      .returning();
    return result.length;
  }
}

// Create a function to initialize database with default data
async function initializeDatabaseWithDefaults() {
  const dbStorage = new DatabaseStorage();
  
  try {
    // Check if fashion items exist
    const existingItems = await dbStorage.getFashionItems();
    if (existingItems.length === 0) {
      // Initialize with default shared fashion items
      const defaultItems: InsertFashionItem[] = [
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
          imageUrl: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
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
    
    // Check if admin user exists
    const adminUser = await dbStorage.getUserByUsername("admin");
    if (!adminUser) {
      // Create default admin user with API keys
      const hashedPassword = await bcrypt.hash("W3lcome1!", 12);
      await dbStorage.createUser({
        username: "admin",
        email: "admin@fashionmirror.com",
        password: hashedPassword,
        role: "admin",
        isVerified: "true",
        liveKey: generateApiKey("mk_live_"),
        testKey: generateApiKey("mk_test_"),
        webhookSecret: generateWebhookSecret(),
        allowedDomains: ['fashionmirror.shop'],
        plan: "free",
        totalQuota: 100,
        quotaUsed: 0,
        settings: {},
      });
      console.log("Default admin user created: admin / W3lcome1!");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    // Fallback to MemStorage if database initialization fails
    console.log("Falling back to MemStorage due to database error");
    return new MemStorage();
  }
  
  return dbStorage;
}

// Export storage instance - use database storage
let storageInstance: IStorage;

// Initialize storage asynchronously
async function createStorageInstance(): Promise<IStorage> {
  if (!storageInstance) {
    storageInstance = await initializeDatabaseWithDefaults();
  }
  return storageInstance;
}

// Export a function to get the storage instance
export const getStorage = createStorageInstance;
