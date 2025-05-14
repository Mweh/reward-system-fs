import { pgTable, text, serial, integer, boolean, timestamp, char, varchar, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export interface UserData {
  isAdmin: boolean;
  points: number;
}

export interface RewardData {
  imageUrl?: string;
  description?: string;
}

export const users = pgTable("users", {
  id: char("id", { length: 36 }).primaryKey(),
  fullname: varchar("fullname", { length: 255 }).notNull(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phoneNumber: varchar("phoneNumber", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  active: boolean("active").notNull().default(false),
  data: json("data").$type<UserData>(),
  createdAt: timestamp("createdAt", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: false }).notNull().defaultNow(),
});

export const rewards = pgTable("rewards", {
  id: char("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  points: integer("points").notNull(),
  data: json("data").$type<RewardData>(),
  createdAt: timestamp("createdAt", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: false }).notNull().defaultNow(),
});

export const usersRewards = pgTable("users_rewards", {
  id: char("id", { length: 36 }).primaryKey(),
  userId: char("userId", { length: 36 }).notNull().references(() => users.id),
  rewardId: char("rewardId", { length: 36 }).notNull().references(() => rewards.id),
  status: varchar("status", { length: 255 }).notNull(), // e.g., claimed, process, completed
  data: json("data"),
  createdAt: timestamp("createdAt", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: false }).notNull().defaultNow(),
});

export const logs = pgTable("logs", {
  id: char("id", { length: 36 }).primaryKey(),
  userId: char("userId", { length: 36 }).notNull().references(() => users.id),
  code: varchar("code", { length: 255 }).notNull(),
  action: varchar("action", { length: 255 }).notNull(), // e.g., CLAIM, UPDATE
  description: text("description"),
  data: json("data").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: false }).notNull().defaultNow(),
});

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Reward schemas
export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// User-Reward schemas
export const insertUserRewardSchema = createInsertSchema(usersRewards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Log schemas
export const insertLogSchema = createInsertSchema(logs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema> & {
  data?: RewardData;
};
export type UserReward = typeof usersRewards.$inferSelect;
export type InsertUserReward = z.infer<typeof insertUserRewardSchema>;

export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;
