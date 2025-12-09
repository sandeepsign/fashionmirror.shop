import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, serial, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
// ============================================
// WIDGET TABLES (Mirror.Me Integration)
// ============================================
export const widgetSessions = pgTable("widget_sessions", {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: varchar("user_id"), // References users.id (owner of the API key)
    // Product info
    productImage: varchar("product_image", { length: 2000 }).notNull(),
    productName: varchar("product_name", { length: 255 }),
    productId: varchar("product_id", { length: 255 }),
    productCategory: varchar("product_category", { length: 50 }),
    productPrice: decimal("product_price", { precision: 10, scale: 2 }),
    productCurrency: varchar("product_currency", { length: 3 }),
    productUrl: varchar("product_url", { length: 1000 }),
    // User info (from merchant's system)
    externalUserId: varchar("external_user_id", { length: 255 }),
    userImage: varchar("user_image", { length: 2000 }),
    // Processing
    status: varchar("status", { length: 20 }).default("pending"),
    resultImage: varchar("result_image", { length: 2000 }),
    resultThumbnail: varchar("result_thumbnail", { length: 2000 }),
    processingTime: integer("processing_time"),
    errorCode: varchar("error_code", { length: 50 }),
    errorMessage: text("error_message"),
    // Metadata
    originDomain: varchar("origin_domain", { length: 255 }),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
    // Timestamps
    createdAt: timestamp("created_at").default(sql `now()`).notNull(),
    completedAt: timestamp("completed_at"),
    expiresAt: timestamp("expires_at"),
});
export const widgetAnalytics = pgTable("widget_analytics", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id"), // References users.id (owner of the API key)
    sessionId: varchar("session_id", { length: 64 }).references(() => widgetSessions.id),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    eventData: jsonb("event_data").default({}),
    createdAt: timestamp("created_at").default(sql `now()`).notNull(),
});
// ============================================
// EXISTING USER/APP TABLES
// ============================================
export const users = pgTable("users", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    role: text("role").notNull().default("user"),
    isVerified: text("is_verified").notNull().default("false"),
    verificationToken: text("verification_token"),
    verificationTokenExpires: timestamp("verification_token_expires"),
    // API Keys (generated on account creation)
    liveKey: varchar("live_key", { length: 64 }).unique(),
    testKey: varchar("test_key", { length: 64 }).unique(),
    // Domain whitelist for widget embedding
    allowedDomains: jsonb("allowed_domains").default([]),
    // Subscription plan
    plan: varchar("plan", { length: 50 }).default("free"),
    totalQuota: integer("total_quota").default(100), // Lifetime quota for free tier
    monthlyQuota: integer("monthly_quota"), // Monthly quota for paid plans (null for free)
    quotaUsed: integer("quota_used").default(0),
    quotaResetAt: timestamp("quota_reset_at"),
    // Webhook settings
    webhookUrl: varchar("webhook_url", { length: 500 }),
    webhookSecret: varchar("webhook_secret", { length: 64 }),
    // User settings/preferences
    settings: jsonb("settings").default({}),
    createdAt: timestamp("created_at").default(sql `now()`).notNull(),
    updatedAt: timestamp("updated_at").default(sql `now()`),
});
export const tryOnResults = pgTable("try_on_results", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    userId: varchar("user_id").references(() => users.id),
    modelImageUrl: text("model_image_url").notNull(),
    fashionImageUrl: text("fashion_image_url").notNull(),
    resultImageUrl: text("result_image_url").notNull(),
    fashionItemName: text("fashion_item_name").notNull(),
    fashionCategory: text("fashion_category").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").default(sql `now()`).notNull(),
});
export const fashionItems = pgTable("fashion_items", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    name: text("name").notNull(),
    category: text("category").notNull(),
    imageUrl: text("image_url").notNull(),
    description: text("description"),
    userId: varchar("user_id").references(() => users.id), // null for shared/default items, user-specific otherwise
    isShared: text("is_shared").notNull().default("false"), // true for default items available to all users
    createdAt: timestamp("created_at").default(sql `now()`).notNull(),
});
export const insertUserSchema = createInsertSchema(users).pick({
    username: true,
    email: true,
    password: true,
    role: true,
    isVerified: true,
    verificationToken: true,
    verificationTokenExpires: true,
    liveKey: true,
    testKey: true,
    allowedDomains: true,
    plan: true,
    totalQuota: true,
    monthlyQuota: true,
    quotaUsed: true,
    quotaResetAt: true,
    webhookUrl: true,
    webhookSecret: true,
    settings: true,
});
export const registerUserSchema = createInsertSchema(users).pick({
    username: true,
    email: true,
    password: true,
}).extend({
    password: z.string().min(8, "Password must be at least 8 characters long"),
    email: z.string().email("Invalid email address"),
});
export const loginUserSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});
export const insertTryOnResultSchema = createInsertSchema(tryOnResults).omit({
    id: true,
    createdAt: true,
});
export const insertFashionItemSchema = createInsertSchema(fashionItems).omit({
    id: true,
    createdAt: true,
});
// ============================================
// WIDGET SCHEMAS AND TYPES
// ============================================
// Widget session schemas
export const insertWidgetSessionSchema = createInsertSchema(widgetSessions).omit({
    createdAt: true,
    completedAt: true,
});
export const createWidgetSessionSchema = z.object({
    product: z.object({
        image: z.string().url("Product image must be a valid URL"),
        name: z.string().optional(),
        id: z.string().optional(),
        category: z.enum(["top", "bottom", "dress", "jacket", "outerwear", "shoes", "accessory"]).optional(),
        price: z.number().positive().optional(),
        currency: z.string().length(3).optional(),
        url: z.string().url().optional(),
    }),
    user: z.object({
        id: z.string().optional(),
        image: z.string().url("User image must be a valid URL").optional(),
        email: z.string().email().optional(),
    }).optional(),
    options: z.object({
        skipPhotoStep: z.boolean().optional(),
    }).optional(),
});
// Widget analytics schema
export const insertWidgetAnalyticsSchema = createInsertSchema(widgetAnalytics).omit({
    id: true,
    createdAt: true,
});
export const trackWidgetEventSchema = z.object({
    sessionId: z.string().optional(),
    eventType: z.enum([
        "impression",
        "open",
        "photo_selected",
        "processing_start",
        "completed",
        "error",
        "share",
        "download"
    ]),
    eventData: z.record(z.any()).optional(),
});
// Plan limits configuration
export const planLimits = {
    free: {
        totalQuota: 100, // Lifetime limit
        monthlyQuota: null, // No monthly reset
        webhooks: false,
        customBranding: false,
        analytics: "basic",
        prioritySupport: false,
    },
    starter: {
        totalQuota: null, // Unlimited lifetime
        monthlyQuota: 500, // Monthly limit
        webhooks: true,
        customBranding: false,
        analytics: "standard",
        prioritySupport: false,
    },
    pro: {
        totalQuota: null,
        monthlyQuota: 2000,
        webhooks: true,
        customBranding: true,
        analytics: "advanced",
        prioritySupport: true,
    },
    enterprise: {
        totalQuota: null,
        monthlyQuota: 10000,
        webhooks: true,
        customBranding: true,
        analytics: "advanced",
        prioritySupport: true,
    },
};
