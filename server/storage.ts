import { type User, type InsertUser, type TryOnResult, type InsertTryOnResult, type FashionItem, type InsertFashionItem } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

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
  getFashionItems(): Promise<FashionItem[]>;
  getFashionItemsByCategory(category: string): Promise<FashionItem[]>;
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

  async getFashionItems(): Promise<FashionItem[]> {
    return Array.from(this.fashionItems.values());
  }

  async getFashionItemsByCategory(category: string): Promise<FashionItem[]> {
    return Array.from(this.fashionItems.values()).filter(
      (item) => item.category.toLowerCase() === category.toLowerCase(),
    );
  }

  async createFashionItem(insertItem: InsertFashionItem): Promise<FashionItem> {
    const id = randomUUID();
    const item: FashionItem = {
      ...insertItem,
      id,
      description: insertItem.description || null,
      createdAt: new Date()
    };
    this.fashionItems.set(id, item);
    return item;
  }
}

export const storage = new MemStorage();
