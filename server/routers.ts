import { COOKIE_NAME } from "@shared/const";
import { calculateOrderPrice } from "@shared/pricing";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createMember,
  createOrder,
  getOrderStats,
  listMembers,
  listOrders,
  setSimulatedRole,
  updateMember,
  updateMemberStatus,
  updateOrderStatus,
} from "./db";

const memberPlanSchema = z.enum(["flex", "unlimited", "coach"]);
const memberStatusSchema = z.enum(["active", "paused", "expired"]);
const planDurationSchema = z.enum(["single_visit", "1_month", "3_months", "6_months", "1_year"]);
const paymentMethodSchema = z.enum(["qris", "bank_transfer", "cash"]);
const orderStatusSchema = z.enum(["pending", "paid", "completed", "cancelled"]);
const userRoleSchema = z.enum(["user", "member", "admin", "super_admin"]);

export const memberInputSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(120),
  email: z.string().trim().email("Masukkan alamat email yang valid").max(320),
  phone: z.string().trim().min(8, "Nomor telepon minimal 8 karakter").max(32),
  plan: memberPlanSchema,
  status: memberStatusSchema,
  joinedAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
}).refine((member) => member.expiresAt >= member.joinedAt, {
  message: "Tanggal akhir harus setelah tanggal bergabung",
  path: ["expiresAt"],
});

export const orderInputSchema = z.object({
  customerName: z.string().trim().min(2, "Nama minimal 2 karakter").max(120),
  customerEmail: z.string().trim().email("Email tidak valid").max(320),
  customerPhone: z.string().trim().min(8, "Nomor telepon minimal 8 karakter").max(32),
  tier: memberPlanSchema,
  duration: planDurationSchema,
  promoCode: z.string().trim().max(32).optional(),
  paymentMethod: paymentMethodSchema.default("qris"),
  notes: z.string().max(500).optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    switchRole: publicProcedure
      .input(z.object({ role: userRoleSchema }))
      .mutation(({ input }) => {
        setSimulatedRole(input.role);
        return { success: true, activeRole: input.role };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  members: router({
    list: adminProcedure.query(() => listMembers()),
    stats: adminProcedure.query(async () => {
      const items = await listMembers();
      return items.reduce(
        (summary, member) => {
          summary.total += 1;
          summary[member.status] += 1;
          return summary;
        },
        { total: 0, active: 0, paused: 0, expired: 0 }
      );
    }),
    create: adminProcedure.input(memberInputSchema).mutation(async ({ input }) => {
      await createMember(input);
      return { success: true } as const;
    }),
    update: adminProcedure
      .input(memberInputSchema.safeExtend({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const { id, ...member } = input;
        await updateMember(id, member);
        return { success: true } as const;
      }),
    updateStatus: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: memberStatusSchema }))
      .mutation(async ({ input }) => {
        await updateMemberStatus(input.id, input.status);
        return { success: true } as const;
      }),
  }),
  orders: router({
    calculate: publicProcedure
      .input(
        z.object({
          tier: memberPlanSchema,
          duration: planDurationSchema,
          promoCode: z.string().optional(),
        })
      )
      .query(({ input }) => {
        return calculateOrderPrice(input.tier, input.duration, input.promoCode);
      }),
    create: publicProcedure.input(orderInputSchema).mutation(async ({ input }) => {
      const calculation = calculateOrderPrice(input.tier, input.duration, input.promoCode);
      const timestamp = Date.now().toString().slice(-6);
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const orderNumber = `ZIU-${new Date().toISOString().slice(0, 7).replace("-", "")}-${timestamp}${randomSuffix}`;

      const created = await createOrder({
        orderNumber,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        tier: input.tier,
        duration: input.duration,
        basePrice: calculation.basePrice,
        durationDiscount: calculation.durationDiscount,
        promoCode: calculation.promoCode || null,
        promoDiscount: calculation.promoDiscount,
        finalPrice: calculation.finalPrice,
        paymentMethod: input.paymentMethod,
        status: "paid", // Instant demo confirmation for self-service experience
        notes: input.notes || null,
      });

      return {
        success: true,
        order: created,
        calculation,
      };
    }),
    list: adminProcedure.query(async () => {
      return listOrders();
    }),
    stats: adminProcedure.query(async () => {
      return getOrderStats();
    }),
    myOrders: publicProcedure
      .input(z.object({ email: z.string().email().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const email = input?.email || ctx.user?.email || undefined;
        return listOrders(email);
      }),
    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          status: orderStatusSchema,
        })
      )
      .mutation(async ({ input }) => {
        await updateOrderStatus(input.id, input.status);
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;

