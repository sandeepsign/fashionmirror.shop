import { users, tryOnResults, fashionItems, widgetSessions, widgetAnalytics } from "@shared/schema";
import { randomUUID, randomBytes } from "crypto";
import bcrypt from "bcrypt";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, or, and, sql, desc } from "drizzle-orm";
// Helper to generate API keys
function generateApiKey(prefix) {
    return `${prefix}${randomBytes(24).toString("base64url")}`;
}
// Helper to generate webhook secret
function generateWebhookSecret() {
    return `whsec_${randomBytes(24).toString("base64url")}`;
}
export class MemStorage {
    users;
    tryOnResults;
    fashionItems;
    constructor() {
        this.users = new Map();
        this.tryOnResults = new Map();
        this.fashionItems = new Map();
        // Initialize with some default fashion items
        this.initializeFashionItems();
        // Initialize with default admin user
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
        defaultItems.forEach(item => {
            const id = randomUUID();
            const fashionItem = {
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
    async initializeDefaultAdmin() {
        // Check if admin user already exists
        const existingAdmin = await this.getUserByEmail("admin");
        if (existingAdmin) {
            return; // Admin already exists
        }
        // Create default admin user with specified credentials
        const adminId = randomUUID();
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash("W3lcome1!", saltRounds);
        const adminUser = {
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
            allowedDomains: [],
            plan: "free",
            totalQuota: 100,
            monthlyQuota: null,
            quotaUsed: 0,
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
    async getUser(id) {
        return this.users.get(id);
    }
    async getUserByUsername(username) {
        return Array.from(this.users.values()).find((user) => user.username === username);
    }
    async getUserByEmail(email) {
        return Array.from(this.users.values()).find((user) => user.email === email);
    }
    async getUserByApiKey(apiKey) {
        return Array.from(this.users.values()).find((user) => user.liveKey === apiKey || user.testKey === apiKey);
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
            // API keys - generate if not provided
            liveKey: insertUser.liveKey || generateApiKey("mk_live_"),
            testKey: insertUser.testKey || generateApiKey("mk_test_"),
            allowedDomains: insertUser.allowedDomains || [],
            plan: insertUser.plan || "free",
            totalQuota: insertUser.totalQuota ?? 100,
            monthlyQuota: insertUser.monthlyQuota ?? null,
            quotaUsed: insertUser.quotaUsed ?? 0,
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
    async updateUser(id, updates) {
        const user = this.users.get(id);
        if (!user)
            return undefined;
        const updatedUser = {
            ...user,
            ...updates,
            updatedAt: new Date(),
        };
        this.users.set(id, updatedUser);
        return updatedUser;
    }
    async getUserByVerificationToken(hashedToken) {
        return Array.from(this.users.values()).find((user) => user.verificationToken === hashedToken &&
            user.verificationTokenExpires &&
            user.verificationTokenExpires > new Date());
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
            verificationTokenExpires: clearToken ? null : user.verificationTokenExpires,
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
            verificationTokenExpires: expiresAt,
        };
        this.users.set(id, updatedUser);
        return updatedUser;
    }
    async updateUserApiKeys(id, liveKey, testKey) {
        return this.updateUser(id, { liveKey, testKey });
    }
    async incrementUserQuota(id) {
        const user = this.users.get(id);
        if (user) {
            user.quotaUsed = (user.quotaUsed ?? 0) + 1;
            user.updatedAt = new Date();
            this.users.set(id, user);
        }
    }
    async resetUserQuota(id, resetAt) {
        const user = this.users.get(id);
        if (user) {
            user.quotaUsed = 0;
            user.quotaResetAt = resetAt;
            user.updatedAt = new Date();
            this.users.set(id, user);
        }
    }
    async getTryOnResult(id) {
        return this.tryOnResults.get(id);
    }
    async getTryOnResultsByUserId(userId) {
        const results = Array.from(this.tryOnResults.values()).filter((result) => result.userId === userId);
        // Sort by creation date (newest first) and limit to 20
        // Exclude large image data for gallery view to prevent response size issues
        return results
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 20)
            .map(result => ({
            ...result,
            resultImageBase64: '', // Clear heavy image data for gallery
            modelImageBase64: '' // Clear heavy image data for gallery
        }));
    }
    async createTryOnResult(insertResult) {
        const id = randomUUID();
        const result = {
            ...insertResult,
            id,
            userId: insertResult.userId || null,
            metadata: insertResult.metadata || null,
            createdAt: new Date()
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
            // Return only shared items for non-authenticated users
            return allItems.filter(item => item.isShared === "true");
        }
        // Return shared items + user's personal items
        return allItems.filter(item => item.isShared === "true" || item.userId === userId);
    }
    async getFashionItemsByCategory(category, userId) {
        const allItems = Array.from(this.fashionItems.values());
        if (!userId) {
            // Return only shared items for non-authenticated users
            return allItems.filter(item => item.category.toLowerCase() === category.toLowerCase() &&
                item.isShared === "true");
        }
        // Return shared items + user's personal items in this category
        return allItems.filter(item => item.category.toLowerCase() === category.toLowerCase() &&
            (item.isShared === "true" || item.userId === userId));
    }
    async createFashionItem(insertItem) {
        const id = randomUUID();
        const item = {
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
    async deleteTryOnResult(id, userId) {
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
    async deleteFashionItem(id, userId) {
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
    widgetSessionsMap = new Map();
    widgetAnalyticsMap = new Map();
    analyticsIdCounter = 1;
    async getWidgetSession(id) {
        return this.widgetSessionsMap.get(id);
    }
    async getWidgetSessionsByUser(userId, limit = 20) {
        return Array.from(this.widgetSessionsMap.values())
            .filter(s => s.userId === userId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit);
    }
    async createWidgetSession(session) {
        const newSession = {
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
    async updateWidgetSession(id, updates) {
        const session = this.widgetSessionsMap.get(id);
        if (!session)
            return undefined;
        const updated = { ...session, ...updates };
        this.widgetSessionsMap.set(id, updated);
        return updated;
    }
    // Widget analytics methods
    async createWidgetAnalytics(analytics) {
        const id = this.analyticsIdCounter++;
        const newAnalytics = {
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
    async getWidgetAnalyticsByUser(userId, startDate, endDate) {
        return Array.from(this.widgetAnalyticsMap.values())
            .filter(a => {
            if (a.userId !== userId)
                return false;
            if (startDate && a.createdAt < startDate)
                return false;
            if (endDate && a.createdAt > endDate)
                return false;
            return true;
        })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
}
// Database storage implementation using Drizzle ORM
export class DatabaseStorage {
    db;
    constructor() {
        const sql = neon(process.env.DATABASE_URL);
        this.db = drizzle(sql);
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
    async getUserByApiKey(apiKey) {
        const result = await this.db.select().from(users).where(or(eq(users.liveKey, apiKey), eq(users.testKey, apiKey))).limit(1);
        return result[0];
    }
    async updateUser(id, updates) {
        const result = await this.db.update(users)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();
        return result[0];
    }
    async updateUserApiKeys(id, liveKey, testKey) {
        return this.updateUser(id, { liveKey, testKey });
    }
    async incrementUserQuota(id) {
        await this.db.update(users)
            .set({ quotaUsed: sql `${users.quotaUsed} + 1` })
            .where(eq(users.id, id));
    }
    async resetUserQuota(id, resetAt) {
        await this.db.update(users)
            .set({ quotaUsed: 0, quotaResetAt: resetAt })
            .where(eq(users.id, id));
    }
    async getTryOnResult(id) {
        const result = await this.db.select().from(tryOnResults).where(eq(tryOnResults.id, id)).limit(1);
        return result[0];
    }
    async getTryOnResultsByUserId(userId) {
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
            // Return only shared items for non-authenticated users
            return await this.db.select().from(fashionItems).where(eq(fashionItems.isShared, "true"));
        }
        // Return shared items + user's personal items
        return await this.db.select().from(fashionItems).where(or(eq(fashionItems.isShared, "true"), eq(fashionItems.userId, userId)));
    }
    async getFashionItemsByCategory(category, userId) {
        if (!userId) {
            // Return only shared items for non-authenticated users
            return await this.db.select().from(fashionItems).where(and(eq(fashionItems.category, category), eq(fashionItems.isShared, "true")));
        }
        // Return shared items + user's personal items in this category
        return await this.db.select().from(fashionItems).where(and(eq(fashionItems.category, category), or(eq(fashionItems.isShared, "true"), eq(fashionItems.userId, userId))));
    }
    async createFashionItem(item) {
        const result = await this.db.insert(fashionItems).values(item).returning();
        return result[0];
    }
    async deleteTryOnResult(id, userId) {
        const result = await this.db.delete(tryOnResults).where(and(eq(tryOnResults.id, id), eq(tryOnResults.userId, userId))).returning();
        return result.length > 0;
    }
    async deleteFashionItem(id, userId) {
        const result = await this.db.delete(fashionItems).where(and(eq(fashionItems.id, id), eq(fashionItems.userId, userId))).returning();
        return result.length > 0;
    }
    // Widget session methods
    async getWidgetSession(id) {
        const result = await this.db.select().from(widgetSessions).where(eq(widgetSessions.id, id)).limit(1);
        return result[0];
    }
    async getWidgetSessionsByUser(userId, limit = 20) {
        return await this.db.select().from(widgetSessions)
            .where(eq(widgetSessions.userId, userId))
            .orderBy(desc(widgetSessions.createdAt))
            .limit(limit);
    }
    async createWidgetSession(session) {
        const result = await this.db.insert(widgetSessions).values(session).returning();
        return result[0];
    }
    async updateWidgetSession(id, updates) {
        const result = await this.db.update(widgetSessions)
            .set(updates)
            .where(eq(widgetSessions.id, id))
            .returning();
        return result[0];
    }
    // Widget analytics methods
    async createWidgetAnalytics(analytics) {
        const result = await this.db.insert(widgetAnalytics).values(analytics).returning();
        return result[0];
    }
    async getWidgetAnalyticsByUser(userId, startDate, endDate) {
        let query = this.db.select().from(widgetAnalytics)
            .where(eq(widgetAnalytics.userId, userId))
            .orderBy(desc(widgetAnalytics.createdAt));
        // Note: For date filtering, we'd need to add additional where clauses
        // This is a simplified version - in production, use proper date filtering
        return await query;
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
                allowedDomains: [],
                plan: "free",
                totalQuota: 100,
                quotaUsed: 0,
                settings: {},
            });
            console.log("Default admin user created: admin / W3lcome1!");
        }
    }
    catch (error) {
        console.error("Error initializing database:", error);
        // Fallback to MemStorage if database initialization fails
        console.log("Falling back to MemStorage due to database error");
        return new MemStorage();
    }
    return dbStorage;
}
// Export storage instance - use database storage
let storageInstance;
// Initialize storage asynchronously
async function createStorageInstance() {
    if (!storageInstance) {
        storageInstance = await initializeDatabaseWithDefaults();
    }
    return storageInstance;
}
// Export a function to get the storage instance
export const getStorage = createStorageInstance;
