import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import { createContext } from "./_core/context";
import { registerOAuthRoutes } from "./_core/oauth";
import { appRouter } from "./routers";

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
registerOAuthRoutes(app);
app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

export default app;
