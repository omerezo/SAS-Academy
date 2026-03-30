import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { storage } from "./storage";
import { signToken, verifyToken } from "./authjwt";
// no external crypto libs required for token in this simplified JWT-like approach
import * as schema from "@shared/schema";
import {
  insertPlayerSchema, insertCoachSchema, insertExpenditureSchema,
  insertFeePaymentSchema, insertSalaryPaymentSchema, insertFamilySchema,
  insertSessionSchema, insertUserSchema, insertIncomeRecordSchema, type UserRole,
} from "@shared/schema";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|pdf)$/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error("Only image and PDF files are allowed"));
  },
});

// Supabase Storage setup
let supabase: any = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

let cachedAdminId: string | null = null;


function asyncHandler(fn: (req: Request, res: Response) => Promise<any>) {
  return (req: Request, res: Response) => {
    fn(req, res).catch((err) => {
      console.error(`Error in ${req.method} ${req.path}:`, err);
      if (!res.headersSent) res.status(500).json({ message: "Internal server error" });
    });
  };
}

async function getAdminUserId(): Promise<string | null> {
  if (cachedAdminId) return cachedAdminId;
  const users = await storage.listUsers();
  const admin = users.find(u => u.role === 'admin');
  if (admin) {
    cachedAdminId = admin.id;
    return admin.id;
  }
  return null;
}

// JWT helpers moved to server/authjwt.ts

function getUserIdFromRequest(req: Request): string | null {
  // JWT-like token approach (stateless)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const verified = verifyToken(token);
    console.log("[AUTH] token:", token, "verified:", verified);
    if (verified) return verified.userId;
  }
  // Fallback to session
  if (req.session?.userId) return req.session.userId;
  // Fallback admin id (for debug/admin)
  return cachedAdminId;
}

function requireAuth(req: Request, res: Response, next: () => void) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  if (!req.session) req.session = {} as any;
  req.session.userId = userId;
  next();
}

function requireRole(...roles: UserRole[]) {
  return async (req: Request, res: Response, next: () => void) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(user.role as UserRole)) return res.status(403).json({ message: "Forbidden" });
    if (!req.session) req.session = {} as any;
    req.session.userId = userId;
    next();
  };
}

function canMutate(req: Request, res: Response, next: () => void) {
  return requireRole("admin", "manager")(req, res, next);
}

function canFinance(req: Request, res: Response, next: () => void) {
  return requireRole("admin", "manager", "accountant")(req, res, next);
}

function canAttendance(req: Request, res: Response, next: () => void) {
  return requireRole("admin", "manager", "coach")(req, res, next);
}

function adminOnly(req: Request, res: Response, next: () => void) {
  return requireRole("admin")(req, res, next);
}

async function seedAdminUser() {
  try {
    const count = await storage.countUsers();
    if (count === 0) {
      const hashed = await bcrypt.hash("admin123", 10);
      await storage.createUser({
        username: "admin",
        password: hashed,
        displayName: "Administrator",
        role: "admin",
      });
      console.log("Default admin created — username: admin  password: admin123");
    }
  } catch (err) {
    console.error("Failed to seed admin:", err);
  }
}

const tableMap: Record<string, any> = {
  users: schema.users,
  families: schema.families,
  players: schema.players,
  coaches: schema.coaches,
  expenditures: schema.expenditures,
  fee_payments: schema.feePayments,
  salary_payments: schema.salaryPayments,
  sessions: schema.sessions,
  attendance: schema.attendance,
  income_records: schema.incomeRecords,
};

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  await seedAdminUser();
  
  // Cache admin user ID after seeding
  const users = await storage.listUsers();
  const admin = users.find(u => u.role === 'admin');
  if (admin) {
    cachedAdminId = admin.id;
    console.log("Admin user cached:", admin.id);
  }

  // Data export routes for migration (temporary)
  app.get("/api/export/:table", requireAuth, adminOnly, asyncHandler(async (req, res) => {
    const tableName = req.params.table;
    const table = tableMap[tableName];
    if (!table) {
      return res.status(400).json({ message: "Invalid table name" });
    }
    const { db } = await import("./db");
    const data = await db.select().from(table);
    res.json(data);
  }));

  app.use("/uploads", (await import("express")).default.static(uploadsDir));

  app.post("/api/upload", requireAuth, upload.single("file"), asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    
    // Use Supabase Storage if available, otherwise use local storage
    if (supabase) {
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        const fileName = `${Date.now()}-${req.file.originalname}`;
        
        const { data, error } = await supabase.storage
          .from("documents")
          .upload(fileName, fileBuffer, {
            contentType: req.file.mimetype,
            upsert: true
          });
        
        if (error) {
          console.error("Supabase upload error:", error);
          // Fallback to local storage
          res.json({ url: `/uploads/${req.file.filename}` });
          return;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from("documents")
          .getPublicUrl(fileName);
        
        // Clean up local file
        fs.unlinkSync(req.file.path);
        
        res.json({ url: publicUrl });
      } catch (uploadError) {
        console.error("Upload error:", uploadError);
        res.json({ url: `/uploads/${req.file.filename}` });
      }
    } else {
      res.json({ url: `/uploads/${req.file.filename}` });
    }
  }));

// Debug endpoint
app.get("/api/debug", asyncHandler(async (req, res) => {
    try {
      const users = await storage.listUsers();
      res.json({ 
        userCount: users.length, 
        users: users.map(u => ({ id: u.id, username: u.username, role: u.role })),
        session: req.session?.userId ? "exists" : "none"
      });
    } catch (err: any) {
      console.error("Debug error:", err);
      res.status(500).json({ error: err.message });
    }
}));

// Debug endpoint to verify a token sent as query param
app.get("/api/debug/verify-token", (req, res) => {
  const token = (req.query.token as string) || '';
  if (!token) return res.status(400).json({ ok: false, message: 'token query param required' });
  const result = verifyToken(token);
  res.json({ token, valid: !!result, payload: result });
});

  app.post("/api/auth/login", asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Username and password required" });
    const user = await storage.getUserByUsername(username.trim());
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });
    
    // Generate token
    const token = signToken(user.id);
    if (!token) {
      console.error("[LOGIN] ERROR: signToken returned empty for user", user.id);
    } else {
      console.log("[LOGIN] Token generated for user", user.username, "length:", token.length);
    }
    
    const { password: _pw, ...safeUser } = user;
    res.json({ ...safeUser, token });
  }));

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", asyncHandler(async (req, res) => {
    // Check JWT token first (stateless, works across Railway dynos)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const verified = verifyToken(token);
      if (verified) {
        const user = await storage.getUser(verified.userId);
        if (user) {
          const { password: _pw, ...safeUser } = user;
          return res.json(safeUser);
        }
      }
    }
    // Fallback to session
    if (req.session?.userId) {
      const user = await storage.getUser(req.session.userId);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const { password: _pw, ...safeUser } = user;
      return res.json(safeUser);
    }
    return res.status(401).json({ message: "Not authenticated" });
  }));

  app.get("/api/users", requireAuth, adminOnly, asyncHandler(async (_req, res) => {
    const list = await storage.listUsers();
    res.json(list.map(({ password: _pw, ...u }) => u));
  }));

  app.post("/api/users", requireAuth, adminOnly, asyncHandler(async (req, res) => {
    const { username, password, displayName, role } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Username and password required" });
    const existing = await storage.getUserByUsername(username.trim());
    if (existing) return res.status(409).json({ message: "Username already exists" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await storage.createUser({ username: username.trim(), password: hashed, displayName: displayName || username, role: role || "viewer" });
    const { password: _pw, ...safeUser } = user;
    res.status(201).json(safeUser);
  }));

  app.patch("/api/users/:id", requireAuth, adminOnly, asyncHandler(async (req, res) => {
    const { password, displayName, role } = req.body;
    const updates: Record<string, any> = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (role !== undefined) updates.role = role;
    if (password) updates.password = await bcrypt.hash(password, 10);
    const user = await storage.updateUser(req.params.id, updates);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { password: _pw, ...safeUser } = user;
    res.json(safeUser);
  }));

  app.delete("/api/users/:id", requireAuth, adminOnly, asyncHandler(async (req, res) => {
    if (req.params.id === req.session.userId) return res.status(400).json({ message: "Cannot delete your own account" });
    const deleted = await storage.deleteUser(req.params.id);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    res.json({ success: true });
  }));

  app.get("/api/dashboard/stats", requireAuth, asyncHandler(async (req, res) => {
    const month = req.query.month as string | undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const stats = await storage.getDashboardStats(month, year);
    res.json(stats);
  }));

  app.get("/api/players", requireAuth, asyncHandler(async (req, res) => {
    const search = req.query.search as string | undefined;
    const result = search ? await storage.searchPlayers(search) : await storage.getPlayers();
    res.json(result);
  }));

  app.get("/api/players/:id", requireAuth, asyncHandler(async (req, res) => {
    const player = await storage.getPlayer(req.params.id);
    if (!player) return res.status(404).json({ message: "Player not found" });
    res.json(player);
  }));

  app.post("/api/players", requireAuth, canMutate, asyncHandler(async (req, res) => {
    const parsed = insertPlayerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const player = await storage.createPlayer(parsed.data);
    res.status(201).json(player);
  }));

  app.patch("/api/players/:id", requireAuth, canMutate, asyncHandler(async (req, res) => {
    const player = await storage.updatePlayer(req.params.id, req.body);
    if (!player) return res.status(404).json({ message: "Player not found" });
    res.json(player);
  }));

  app.delete("/api/players/:id", requireAuth, canMutate, asyncHandler(async (req, res) => {
    const deleted = await storage.deletePlayer(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Player not found" });
    res.json({ success: true });
  }));

  app.get("/api/families", requireAuth, asyncHandler(async (_req, res) => {
    const result = await storage.getFamilies();
    const withMembers = await Promise.all(result.map(async (f) => {
      const members = await storage.getFamilyMembers(f.id);
      return { ...f, members, memberCount: members.length };
    }));
    res.json(withMembers);
  }));

  app.get("/api/families/:id", requireAuth, asyncHandler(async (req, res) => {
    const family = await storage.getFamily(req.params.id);
    if (!family) return res.status(404).json({ message: "Family not found" });
    const members = await storage.getFamilyMembers(family.id);
    res.json({ ...family, members });
  }));

  app.post("/api/families", requireAuth, canMutate, asyncHandler(async (req, res) => {
    const parsed = insertFamilySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const family = await storage.createFamily(parsed.data);
    res.status(201).json(family);
  }));

  app.patch("/api/families/:id", requireAuth, canMutate, asyncHandler(async (req, res) => {
    const partial = insertFamilySchema.partial().safeParse(req.body);
    if (!partial.success) return res.status(400).json({ message: partial.error.message });
    const family = await storage.updateFamily(req.params.id, partial.data);
    if (!family) return res.status(404).json({ message: "Family not found" });
    res.json(family);
  }));

  app.delete("/api/families/:id", requireAuth, canMutate, asyncHandler(async (req, res) => {
    const deleted = await storage.deleteFamily(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Family not found" });
    res.json({ success: true });
  }));

  app.post("/api/families/:id/collect-fees", requireAuth, canFinance, asyncHandler(async (req, res) => {
    const { month, year, totalAmount } = req.body;
    if (!month || typeof month !== "string") return res.status(400).json({ message: "month is required (string)" });
    if (!year || isNaN(Number(year))) return res.status(400).json({ message: "year is required (number)" });
    if (!totalAmount || isNaN(Number(totalAmount)) || Number(totalAmount) <= 0) return res.status(400).json({ message: "totalAmount is required (positive number)" });
    const family = await storage.getFamily(req.params.id);
    if (!family) return res.status(404).json({ message: "Family not found" });
    const payments = await storage.collectFamilyFees(req.params.id, month, Number(year), Number(totalAmount));
    if (payments.length === 0) return res.status(400).json({ message: "No active members in this family" });
    res.status(201).json(payments);
  }));

  app.get("/api/coaches", requireAuth, asyncHandler(async (_req, res) => {
    res.json(await storage.getCoaches());
  }));

  app.get("/api/coaches/:id", requireAuth, asyncHandler(async (req, res) => {
    const coach = await storage.getCoach(req.params.id);
    if (!coach) return res.status(404).json({ message: "Coach not found" });
    res.json(coach);
  }));

  app.post("/api/coaches", requireAuth, canMutate, asyncHandler(async (req, res) => {
    const parsed = insertCoachSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.status(201).json(await storage.createCoach(parsed.data));
  }));

  app.patch("/api/coaches/:id", requireAuth, canMutate, asyncHandler(async (req, res) => {
    const coach = await storage.updateCoach(req.params.id, req.body);
    if (!coach) return res.status(404).json({ message: "Coach not found" });
    res.json(coach);
  }));

  app.delete("/api/coaches/:id", requireAuth, canMutate, asyncHandler(async (req, res) => {
    const deleted = await storage.deleteCoach(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Coach not found" });
    res.json({ success: true });
  }));

  app.get("/api/expenditures", requireAuth, asyncHandler(async (_req, res) => {
    res.json(await storage.getExpenditures());
  }));

  app.get("/api/expenditures/:id", requireAuth, asyncHandler(async (req, res) => {
    const exp = await storage.getExpenditure(req.params.id);
    if (!exp) return res.status(404).json({ message: "Expenditure not found" });
    res.json(exp);
  }));

  app.post("/api/expenditures", requireAuth, canFinance, asyncHandler(async (req, res) => {
    const parsed = insertExpenditureSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.status(201).json(await storage.createExpenditure(parsed.data));
  }));

  app.patch("/api/expenditures/:id", requireAuth, canFinance, asyncHandler(async (req, res) => {
    const exp = await storage.updateExpenditure(req.params.id, req.body);
    if (!exp) return res.status(404).json({ message: "Expenditure not found" });
    res.json(exp);
  }));

  app.delete("/api/expenditures/:id", requireAuth, canFinance, asyncHandler(async (req, res) => {
    const deleted = await storage.deleteExpenditure(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Expenditure not found" });
    res.json({ success: true });
  }));

  app.get("/api/fee-payments", requireAuth, asyncHandler(async (_req, res) => {
    res.json(await storage.getFeePayments());
  }));

  app.post("/api/fee-payments", requireAuth, canFinance, asyncHandler(async (req, res) => {
    const parsed = insertFeePaymentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.status(201).json(await storage.createFeePayment(parsed.data));
  }));

  app.patch("/api/fee-payments/:id", requireAuth, canFinance, asyncHandler(async (req, res) => {
    const payment = await storage.updateFeePayment(req.params.id, req.body);
    if (!payment) return res.status(404).json({ message: "Fee payment not found" });
    res.json(payment);
  }));

  app.delete("/api/fee-payments/:id", requireAuth, canFinance, asyncHandler(async (req, res) => {
    const deleted = await storage.deleteFeePayment(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Fee payment not found" });
    res.json({ success: true });
  }));

  app.get("/api/salary-payments", requireAuth, asyncHandler(async (_req, res) => {
    res.json(await storage.getSalaryPayments());
  }));

  app.post("/api/salary-payments", requireAuth, canFinance, asyncHandler(async (req, res) => {
    const parsed = insertSalaryPaymentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.status(201).json(await storage.createSalaryPayment(parsed.data));
  }));

  app.patch("/api/salary-payments/:id", requireAuth, canFinance, asyncHandler(async (req, res) => {
    const payment = await storage.updateSalaryPayment(req.params.id, req.body);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json(payment);
  }));

  app.delete("/api/salary-payments/:id", requireAuth, canFinance, asyncHandler(async (req, res) => {
    const deleted = await storage.deleteSalaryPayment(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Payment not found" });
    res.json({ success: true });
  }));

  app.get("/api/sessions", requireAuth, asyncHandler(async (_req, res) => {
    const result = await storage.getSessions();
    const withCounts = await Promise.all(result.map(async (s) => {
      const att = await storage.getSessionAttendance(s.id);
      return { ...s, presentCount: att.filter((a) => a.present).length, totalCount: att.length };
    }));
    res.json(withCounts);
  }));

  app.post("/api/sessions", requireAuth, canAttendance, asyncHandler(async (req, res) => {
    const parsed = insertSessionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.status(201).json(await storage.createSession(parsed.data));
  }));

  app.delete("/api/sessions/:id", requireAuth, canAttendance, asyncHandler(async (req, res) => {
    const deleted = await storage.deleteSession(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Session not found" });
    res.json({ success: true });
  }));

  app.get("/api/sessions/:id/attendance", requireAuth, asyncHandler(async (req, res) => {
    const session = await storage.getSession(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(await storage.getSessionAttendance(req.params.id));
  }));

  app.post("/api/sessions/:id/attendance", requireAuth, canAttendance, asyncHandler(async (req, res) => {
    const session = await storage.getSession(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    const { records } = req.body;
    if (!Array.isArray(records)) return res.status(400).json({ message: "records must be an array" });
    res.json(await storage.saveSessionAttendance(req.params.id, records));
  }));

  app.get("/api/income-records", requireAuth, asyncHandler(async (_req, res) => {
    res.json(await storage.getIncomeRecords());
  }));

  app.post("/api/income-records", requireAuth, canFinance, asyncHandler(async (req, res) => {
    const parsed = insertIncomeRecordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.status(201).json(await storage.createIncomeRecord(parsed.data));
  }));

  app.delete("/api/income-records/:id", requireAuth, canFinance, asyncHandler(async (req, res) => {
    const deleted = await storage.deleteIncomeRecord(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Income record not found" });
    res.json({ success: true });
  }));

  return httpServer;
}
