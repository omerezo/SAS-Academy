import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { pool } from "./db";
import * as schema from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

const app = express();
const httpServer = createServer(app);

app.set('trust proxy', 1);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || "sas-fallback-secret",
    resave: false,
    saveUninitialized: false,
    name: 'sas.sid',
    cookie: {
      secure: true,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      path: '/',
    },
  })
);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Basic CORS for frontend apps
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const responseStr = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${responseStr.length > 200 ? responseStr.slice(0, 200) + '...' : responseStr}`;
      }

      log(logLine);
    }
  });

  next();
});

process.on("SIGHUP", () => {});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

async function createTables() {
  console.log("Creating tables...");
  
  // Create users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      display_name TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'viewer',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Create families table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS families (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      name_ar TEXT,
      custom_fee NUMERIC(10, 2),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Create players table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS players (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      player_code TEXT UNIQUE,
      name TEXT NOT NULL,
      name_ar TEXT,
      date_of_birth DATE NOT NULL,
      age_group TEXT NOT NULL DEFAULT 'U-12',
      position TEXT,
      age INTEGER NOT NULL,
      jersey_number INTEGER NOT NULL,
      nationality TEXT NOT NULL,
      phone TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      join_date DATE NOT NULL,
      monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT '110',
      family_id UUID REFERENCES families(id),
      photo_url TEXT,
      id_document_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Create coaches table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS coaches (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      name_ar TEXT,
      phone TEXT,
      specialty TEXT NOT NULL,
      monthly_salary NUMERIC(10, 2) NOT NULL DEFAULT '0',
      status TEXT NOT NULL DEFAULT 'active',
      join_date DATE NOT NULL,
      photo_url TEXT,
      id_document_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Create expenditures table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenditures (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount NUMERIC(10, 2) NOT NULL,
      date DATE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Create fee_payments table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fee_payments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      player_id UUID NOT NULL REFERENCES players(id),
      amount NUMERIC(10, 2) NOT NULL,
      month TEXT NOT NULL,
      year INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      paid_date DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Create salary_payments table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS salary_payments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      coach_id UUID NOT NULL REFERENCES coaches(id),
      amount NUMERIC(10, 2) NOT NULL,
      month TEXT NOT NULL,
      year INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      paid_date DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Create sessions table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      date DATE NOT NULL,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Create attendance table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      session_id UUID NOT NULL REFERENCES sessions(id),
      player_id UUID NOT NULL REFERENCES players(id),
      present BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Create income_records table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS income_records (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      source TEXT NOT NULL,
      description TEXT,
      amount NUMERIC(10, 2) NOT NULL,
      date DATE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Create user_sessions table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "user_sessions" (
      "sid" VARCHAR NOT NULL COLLATE "default",
      "sess" JSON NOT NULL,
      "expire" TIMESTAMP(6) NOT NULL,
      PRIMARY KEY ("sid")
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON "user_sessions" ("expire")
  `);

  console.log("Tables created successfully!");
}

async function start() {
  const port = parseInt(process.env.PORT || "3000", 10);
  
  console.log("Starting server...");
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "set" : "MISSING");
  console.log("PORT:", port);
  
  try {
    // Enable UUID extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log("UUID extension enabled");
    
    // Create tables
    await createTables();
    
    await registerRoutes(httpServer, app);
    console.log("Routes registered");
  } catch (err) {
    console.error("Failed to initialize:", err);
  }

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  serveStatic(app);

  httpServer.listen({ port, host: "0.0.0.0" }, () => {
    console.log(`Server running on port ${port}`);
  });
}

start();
