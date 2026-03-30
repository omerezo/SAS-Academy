import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServer } from "http";
import express, { type Request, Response } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

let app: express.Express | null = null;
let initialized = false;

async function getApp(): Promise<express.Express> {
  if (app && initialized) return app;
  
  app = express();
  const httpServer = createServer(app);

  const PgSession = connectPgSimple(session);

  app.use(
    session({
      store: new PgSession({
        conString: process.env.DATABASE_URL,
        tableName: "user_sessions",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "sas-fallback-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }));

  app.use(express.urlencoded({ extended: false }));

  try {
    const { registerRoutes } = await import("../server/routes");
    await registerRoutes(httpServer, app);
  } catch (err) {
    console.error("Failed to register routes:", err);
  }

  app.use((err: any, _req: Request, res: Response) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Error:", err);
    if (res.headersSent) return;
    return res.status(status).json({ message });
  });

  initialized = true;
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const expressApp = await getApp();
    expressApp(req, res);
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
