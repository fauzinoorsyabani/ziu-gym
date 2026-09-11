import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const userRoles = ["user", "member", "admin", "super_admin"] as const;
export type UserRole = (typeof userRoles)[number];

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", userRoles).default("member").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const memberPlans = ["flex", "unlimited", "coach"] as const;
export const memberStatuses = ["active", "paused", "expired"] as const;

export const members = mysqlTable("members", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 32 }).notNull(),
  plan: mysqlEnum("plan", memberPlans).notNull(),
  status: mysqlEnum("status", memberStatuses).default("active").notNull(),
  joinedAt: timestamp("joinedAt").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Member = typeof members.$inferSelect;
export type InsertMember = typeof members.$inferInsert;

export const planDurations = ["single_visit", "1_month", "3_months", "6_months", "1_year"] as const;
export type PlanDuration = (typeof planDurations)[number];

export const orderStatuses = ["pending", "paid", "completed", "cancelled"] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const paymentMethods = ["qris", "bank_transfer", "cash"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 64 }).notNull().unique(),
  customerName: varchar("name", { length: 120 }).notNull(),
  customerEmail: varchar("email", { length: 320 }).notNull(),
  customerPhone: varchar("phone", { length: 32 }).notNull(),
  duration: mysqlEnum("duration", planDurations).notNull(),
  tier: mysqlEnum("tier", memberPlans).notNull(),
  basePrice: int("basePrice").notNull(),
  durationDiscount: int("durationDiscount").default(0).notNull(),
  promoCode: varchar("promoCode", { length: 32 }),
  promoDiscount: int("promoDiscount").default(0).notNull(),
  finalPrice: int("finalPrice").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", paymentMethods).default("qris").notNull(),
  status: mysqlEnum("status", orderStatuses).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
