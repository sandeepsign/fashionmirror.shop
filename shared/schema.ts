import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const tryOnResults = pgTable("try_on_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  modelImageUrl: text("model_image_url").notNull(),
  fashionImageUrl: text("fashion_image_url").notNull(),
  resultImageUrl: text("result_image_url").notNull(),
  fashionItemName: text("fashion_item_name").notNull(),
  fashionCategory: text("fashion_category").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const fashionItems = pgTable("fashion_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTryOnResultSchema = createInsertSchema(tryOnResults).omit({
  id: true,
  createdAt: true,
});

export const insertFashionItemSchema = createInsertSchema(fashionItems).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTryOnResult = z.infer<typeof insertTryOnResultSchema>;
export type TryOnResult = typeof tryOnResults.$inferSelect;
export type InsertFashionItem = z.infer<typeof insertFashionItemSchema>;
export type FashionItem = typeof fashionItems.$inferSelect;
