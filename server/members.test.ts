import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  createMember: vi.fn(),
  listMembers: vi.fn(),
  updateMember: vi.fn(),
  updateMemberStatus: vi.fn(),
}));

import { createMember, updateMember, updateMemberStatus } from "./db";
import { appRouter, memberInputSchema } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMemberInput() {
  return {
    name: "Raka Pratama",
    email: "raka@example.com",
    phone: "081234567890",
    plan: "flex" as const,
    status: "active" as const,
    joinedAt: new Date("2026-08-01T12:00:00.000Z"),
    expiresAt: new Date("2026-09-01T12:00:00.000Z"),
  };
}

function createContext(role: "admin" | "user"): TrpcContext {
  return {
    user: {
      id: role === "admin" ? 1 : 2,
      openId: `${role}-user`,
      name: `${role} User`,
      email: `${role}@example.com`,
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

beforeEach(() => vi.clearAllMocks());

describe("member input validation", () => {
  it("accepts a valid member record", () => {
    const parsed = memberInputSchema.parse({ ...createMemberInput(), joinedAt: "2026-08-01", expiresAt: "2026-09-01" });

    expect(parsed.name).toBe("Raka Pratama");
    expect(parsed.plan).toBe("flex");
    expect(parsed.joinedAt).toBeInstanceOf(Date);
  });

  it("rejects an expiry date before the joined date", () => {
    const input = { ...createMemberInput(), expiresAt: new Date("2026-07-31T12:00:00.000Z") };

    expect(() => memberInputSchema.parse(input)).toThrow("Tanggal akhir harus setelah tanggal bergabung");
  });
});

describe("members router mutations", () => {
  it("allows an administrator to create a member", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    const input = createMemberInput();

    await expect(caller.members.create(input)).resolves.toEqual({ success: true });
    expect(createMember).toHaveBeenCalledWith(input);
  });

  it("allows an administrator to update member details and status", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    const input = createMemberInput();

    await expect(caller.members.update({ ...input, id: 8 })).resolves.toEqual({ success: true });
    await expect(caller.members.updateStatus({ id: 8, status: "paused" })).resolves.toEqual({ success: true });
    expect(updateMember).toHaveBeenCalledWith(8, input);
    expect(updateMemberStatus).toHaveBeenCalledWith(8, "paused");
  });

  it("rejects all member mutations from a non-admin user", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    const input = createMemberInput();

    await expect(caller.members.create(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.members.update({ ...input, id: 8 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.members.updateStatus({ id: 8, status: "expired" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
