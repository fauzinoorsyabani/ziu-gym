import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertMember,
  InsertOrder,
  InsertUser,
  Member,
  Order,
  User,
  UserRole,
  members,
  orders,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Simulated role for demo and testing without external auth
let currentRole: UserRole = "super_admin";

export async function getCurrentUser(): Promise<User> {
  if (currentRole === "super_admin") {
    return {
      id: 1,
      openId: "super-admin-local",
      name: "Fauzi (Super Admin)",
      email: "owner@ziugym.com",
      loginMethod: "local",
      role: "super_admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
  }
  if (currentRole === "admin") {
    return {
      id: 2,
      openId: "admin-staff-local",
      name: "Rian (Frontdesk Admin)",
      email: "staff@ziugym.com",
      loginMethod: "local",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
  }
  return {
    id: 3,
    openId: "member-local",
    name: "Raka Pratama (Member Gym)",
    email: "raka.pratama@example.com",
    loginMethod: "local",
    role: "member",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

export function setSimulatedRole(role: UserRole) {
  currentRole = role;
}

export function getSimulatedRole(): UserRole {
  return currentRole;
}

// In-memory orders for demonstration and checkout
const memoryOrders: Order[] = [
  {
    id: 1,
    orderNumber: "ZIU-202609-001",
    customerName: "Raka Pratama",
    customerEmail: "raka.pratama@example.com",
    customerPhone: "081234567890",
    duration: "3_months",
    tier: "unlimited",
    basePrice: 1_500_000,
    durationDiscount: 225_000,
    promoCode: "ZIUFIRST",
    promoDiscount: 127_500,
    finalPrice: 1_147_500,
    paymentMethod: "qris",
    status: "paid",
    notes: "Pemesanan paket Unlimited 3 Bulan via Mobile Web",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 2,
    orderNumber: "ZIU-202609-002",
    customerName: "Siti Nurhaliza",
    customerEmail: "siti.n@example.com",
    customerPhone: "082198765432",
    duration: "1_year",
    tier: "coach",
    basePrice: 14_400_000,
    durationDiscount: 5_760_000,
    promoCode: "FIT2026",
    promoDiscount: 50_000,
    finalPrice: 8_590_000,
    paymentMethod: "bank_transfer",
    status: "paid",
    notes: "Paket Coach VIP 1 Tahun + Bonus Gym Bag",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    id: 3,
    orderNumber: "ZIU-202609-003",
    customerName: "Dimas Arya",
    customerEmail: "dimas.arya@example.com",
    customerPhone: "085712345678",
    duration: "1_month",
    tier: "flex",
    basePrice: 350_000,
    durationDiscount: 0,
    promoCode: null,
    promoDiscount: 0,
    finalPrice: 350_000,
    paymentMethod: "qris",
    status: "paid",
    notes: "Paket Bulanan Flex",
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
  },
  {
    id: 4,
    orderNumber: "ZIU-202609-004",
    customerName: "Fajar Nugraha",
    customerEmail: "fajar.n@example.com",
    customerPhone: "081288990011",
    duration: "single_visit",
    tier: "unlimited",
    basePrice: 75_000,
    durationDiscount: 0,
    promoCode: null,
    promoDiscount: 0,
    finalPrice: 75_000,
    paymentMethod: "qris",
    status: "pending",
    notes: "Drop-in pass harian",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 5,
    orderNumber: "ZIU-202609-005",
    customerName: "Amanda Putri",
    customerEmail: "amanda.p@example.com",
    customerPhone: "087733445566",
    duration: "6_months",
    tier: "flex",
    basePrice: 2_100_000,
    durationDiscount: 525_000,
    promoCode: "STUDENT",
    promoDiscount: 236_250,
    finalPrice: 1_338_750,
    paymentMethod: "qris",
    status: "paid",
    notes: "Diskon Mahasiswa 6 Bulan",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];
let nextOrderId = 6;

// In-memory fallback members for local environment without MySQL database
const memoryMembers: Member[] = [
  {
    id: 1,
    name: "Raka Pratama",
    email: "raka.pratama@example.com",
    phone: "081234567890",
    plan: "unlimited",
    status: "active",
    joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: 2,
    name: "Siti Nurhaliza",
    email: "siti.n@example.com",
    phone: "082198765432",
    plan: "coach",
    status: "active",
    joinedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: 3,
    name: "Dimas Arya",
    email: "dimas.arya@example.com",
    phone: "085712345678",
    plan: "flex",
    status: "paused",
    joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: 4,
    name: "Budi Santoso",
    email: "budi.s@example.com",
    phone: "081399887766",
    plan: "flex",
    status: "expired",
    joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
];
let nextMemberId = 5;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listMembers() {
  const db = await getDb();
  if (!db) {
    return [...memoryMembers].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  return db.select().from(members).orderBy(desc(members.createdAt));
}

export async function createMember(member: InsertMember) {
  const db = await getDb();
  if (!db) {
    const newMember: Member = {
      id: nextMemberId++,
      name: member.name,
      email: member.email,
      phone: member.phone,
      plan: member.plan,
      status: member.status ?? "active",
      joinedAt: member.joinedAt,
      expiresAt: member.expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryMembers.unshift(newMember);
    return;
  }

  await db.insert(members).values(member);
}

export async function updateMember(id: number, member: Partial<InsertMember>) {
  const db = await getDb();
  if (!db) {
    const index = memoryMembers.findIndex((m) => m.id === id);
    if (index !== -1) {
      memoryMembers[index] = {
        ...memoryMembers[index],
        ...member,
        updatedAt: new Date(),
      };
    }
    return;
  }

  await db.update(members).set(member).where(eq(members.id, id));
}

export async function updateMemberStatus(id: number, status: InsertMember["status"]) {
  const db = await getDb();
  if (!db) {
    const index = memoryMembers.findIndex((m) => m.id === id);
    if (index !== -1 && status) {
      memoryMembers[index].status = status;
      memoryMembers[index].updatedAt = new Date();
    }
    return;
  }

  await db.update(members).set({ status }).where(eq(members.id, id));
}

export async function listOrders(userEmail?: string) {
  const db = await getDb();
  if (!db) {
    if (userEmail) {
      return memoryOrders.filter((o) => o.customerEmail.toLowerCase() === userEmail.toLowerCase());
    }
    return [...memoryOrders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  if (userEmail) {
    return db.select().from(orders).where(eq(orders.customerEmail, userEmail)).orderBy(desc(orders.createdAt));
  }
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) {
    const newOrder: Order = {
      id: nextOrderId++,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      duration: order.duration,
      tier: order.tier,
      basePrice: order.basePrice,
      durationDiscount: order.durationDiscount ?? 0,
      promoCode: order.promoCode ?? null,
      promoDiscount: order.promoDiscount ?? 0,
      finalPrice: order.finalPrice,
      paymentMethod: order.paymentMethod ?? "qris",
      status: order.status ?? "paid",
      notes: order.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryOrders.unshift(newOrder);

    // If order is paid, automatically synchronize or create member pass
    if (newOrder.status === "paid") {
      const existing = memoryMembers.find(
        (m) => m.email.toLowerCase() === newOrder.customerEmail.toLowerCase()
      );
      const now = new Date();
      const expiry = new Date();
      if (newOrder.duration === "single_visit") {
        expiry.setDate(now.getDate() + 1);
      } else if (newOrder.duration === "1_month") {
        expiry.setMonth(now.getMonth() + 1);
      } else if (newOrder.duration === "3_months") {
        expiry.setMonth(now.getMonth() + 3);
      } else if (newOrder.duration === "6_months") {
        expiry.setMonth(now.getMonth() + 6);
      } else {
        expiry.setFullYear(now.getFullYear() + 1);
      }

      if (existing) {
        existing.plan = newOrder.tier;
        existing.status = "active";
        existing.expiresAt = expiry;
        existing.updatedAt = now;
      } else {
        memoryMembers.unshift({
          id: nextMemberId++,
          name: newOrder.customerName,
          email: newOrder.customerEmail,
          phone: newOrder.customerPhone,
          plan: newOrder.tier,
          status: "active",
          joinedAt: now,
          expiresAt: expiry,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return newOrder;
  }

  await db.insert(orders).values(order);
  return order;
}

export async function updateOrderStatus(id: number, status: Order["status"]) {
  const db = await getDb();
  if (!db) {
    const order = memoryOrders.find((o) => o.id === id);
    if (order) {
      order.status = status;
      order.updatedAt = new Date();

      // If status updated to paid, activate the member
      if (status === "paid") {
        const existing = memoryMembers.find(
          (m) => m.email.toLowerCase() === order.customerEmail.toLowerCase()
        );
        const now = new Date();
        const expiry = new Date();
        if (order.duration === "single_visit") expiry.setDate(now.getDate() + 1);
        else if (order.duration === "1_month") expiry.setMonth(now.getMonth() + 1);
        else if (order.duration === "3_months") expiry.setMonth(now.getMonth() + 3);
        else if (order.duration === "6_months") expiry.setMonth(now.getMonth() + 6);
        else expiry.setFullYear(now.getFullYear() + 1);

        if (existing) {
          existing.status = "active";
          existing.expiresAt = expiry;
        } else {
          memoryMembers.unshift({
            id: nextMemberId++,
            name: order.customerName,
            email: order.customerEmail,
            phone: order.customerPhone,
            plan: order.tier,
            status: "active",
            joinedAt: now,
            expiresAt: expiry,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }
    return;
  }

  await db.update(orders).set({ status }).where(eq(orders.id, id));
}

export async function getOrderStats() {
  const allOrders = await listOrders();
  const totalRevenue = allOrders
    .filter((o) => o.status === "paid" || o.status === "completed")
    .reduce((sum, o) => sum + o.finalPrice, 0);
  const totalDiscountGiven = allOrders
    .filter((o) => o.status === "paid" || o.status === "completed")
    .reduce((sum, o) => sum + (o.durationDiscount + o.promoDiscount), 0);
  const pendingOrders = allOrders.filter((o) => o.status === "pending").length;
  const paidOrders = allOrders.filter((o) => o.status === "paid" || o.status === "completed").length;

  return {
    totalRevenue,
    totalDiscountGiven,
    totalOrders: allOrders.length,
    paidOrders,
    pendingOrders,
  };
}

