import { type User, type InsertUser, type TryOnResult, type InsertTryOnResult, type FashionItem, type InsertFashionItem, users, tryOnResults, fashionItems } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, or, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserByVerificationToken(hashedToken: string): Promise<User | undefined>;
  updateUserVerification(id: string, isVerified: string, clearToken?: boolean): Promise<User>;
  
  getTryOnResult(id: string): Promise<TryOnResult | undefined>;
  getTryOnResultsByUserId(userId: string): Promise<TryOnResult[]>;
  createTryOnResult(result: InsertTryOnResult): Promise<TryOnResult>;
  
  getFashionItem(id: string): Promise<FashionItem | undefined>;
  getFashionItems(userId?: string): Promise<FashionItem[]>;
  getFashionItemsByCategory(category: string, userId?: string): Promise<FashionItem[]>;
  createFashionItem(item: InsertFashionItem): Promise<FashionItem>;
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
      createdAt: new Date()
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      role: insertUser.role || "user",
      isVerified: insertUser.isVerified || "false",
      verificationToken: insertUser.verificationToken || null,
      verificationTokenExpires: insertUser.verificationTokenExpires || null,
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
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

  async getTryOnResult(id: string): Promise<TryOnResult | undefined> {
    return this.tryOnResults.get(id);
  }

  async getTryOnResultsByUserId(userId: string): Promise<TryOnResult[]> {
    return Array.from(this.tryOnResults.values()).filter(
      (result) => result.userId === userId,
    );
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

  async getTryOnResult(id: string): Promise<TryOnResult | undefined> {
    const result = await this.db.select().from(tryOnResults).where(eq(tryOnResults.id, id)).limit(1);
    return result[0];
  }

  async getTryOnResultsByUserId(userId: string): Promise<TryOnResult[]> {
    return await this.db.select().from(tryOnResults).where(eq(tryOnResults.userId, userId));
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
    
    // Check if admin user exists
    const adminUser = await dbStorage.getUserByUsername("admin");
    if (!adminUser) {
      // Create default admin user
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
