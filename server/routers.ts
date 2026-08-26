import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { createMember, listMembers, updateMember, updateMemberStatus } from "./db";

const memberPlanSchema = z.enum(["flex", "unlimited", "coach"]);
const memberStatusSchema = z.enum(["active", "paused", "expired"]);

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

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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
        { total: 0, active: 0, paused: 0, expired: 0 },
      );
    }),
    create: adminProcedure.input(memberInputSchema).mutation(async ({ input }) => {
      await createMember(input);
      return { success: true } as const;
    }),
    update: adminProcedure.input(memberInputSchema.safeExtend({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const { id, ...member } = input;
      await updateMember(id, member);
      return { success: true } as const;
    }),
    updateStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: memberStatusSchema })).mutation(async ({ input }) => {
      await updateMemberStatus(input.id, input.status);
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
