import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getCurrentUser } from "../db";
import { ENV } from "./env";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // In local development or standalone mode without external OAuth server,
  // provide current simulated user role (Super Admin, Admin, or Member)
  if (!user && !ENV.oAuthServerUrl) {
    user = await getCurrentUser();
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
