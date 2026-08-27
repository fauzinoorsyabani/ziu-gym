import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { createContext } from "../server/_core/context";
import { appRouter } from "../server/routers";

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
registerOAuthRoutes(app);
app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

export default app;
