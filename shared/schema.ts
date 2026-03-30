import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, date, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull().default(""),
  role: text("role").notNull().default("viewer"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const families = pgTable("families", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  customFee: numeric("custom_fee", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerCode: text("player_code").unique(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  dateOfBirth: date("date_of_birth").notNull(),
  ageGroup: text("age_group").notNull().default("U-12"),
  position: text("position"),
  age: integer("age").notNull(),
  jerseyNumber: integer("jersey_number").notNull(),
  nationality: text("nationality").notNull(),
  phone: text("phone"),
  status: text("status").notNull().default("active"),
  joinDate: date("join_date").notNull(),
  monthlyFee: numeric("monthly_fee", { precision: 10, scale: 2 }).notNull().default("110"),
  familyId: varchar("family_id"),
  photoUrl: text("photo_url"),
  idDocumentUrl: text("id_document_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function getAgeGroup(age: number): string {
  if (age < 8) return "U-8";
  if (age < 10) return "U-10";
  if (age < 12) return "U-12";
  if (age < 14) return "U-14";
  if (age < 16) return "U-16";
  if (age < 18) return "U-18";
  return "Senior";
}

export const coaches = pgTable("coaches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  phone: text("phone"),
  specialty: text("specialty").notNull(),
  monthlySalary: numeric("monthly_salary", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("active"),
  joinDate: date("join_date").notNull(),
  photoUrl: text("photo_url"),
  idDocumentUrl: text("id_document_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenditures = pgTable("expenditures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const feePayments = pgTable("fee_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  month: text("month").notNull(),
  year: integer("year").notNull(),
  status: text("status").notNull().default("pending"),
  paidDate: date("paid_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const salaryPayments = pgTable("salary_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coachId: varchar("coach_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  month: text("month").notNull(),
  year: integer("year").notNull(),
  status: text("status").notNull().default("pending"),
  paidDate: date("paid_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  playerId: varchar("player_id").notNull(),
  present: boolean("present").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const incomeRecords = pgTable("income_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: text("source").notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type UserRole = "admin" | "manager" | "accountant" | "coach" | "viewer";
export const USER_ROLES: UserRole[] = ["admin", "manager", "accountant", "coach", "viewer"];

export const insertFamilySchema = createInsertSchema(families).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  createdAt: true,
});

export const insertCoachSchema = createInsertSchema(coaches).omit({
  id: true,
  createdAt: true,
});

export const insertExpenditureSchema = createInsertSchema(expenditures).omit({
  id: true,
  createdAt: true,
});

export const insertFeePaymentSchema = createInsertSchema(feePayments).omit({
  id: true,
  createdAt: true,
});

export const insertSalaryPaymentSchema = createInsertSchema(salaryPayments).omit({
  id: true,
  createdAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
});

export const insertIncomeRecordSchema = createInsertSchema(incomeRecords).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;
export type Family = typeof families.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;
export type InsertCoach = z.infer<typeof insertCoachSchema>;
export type Coach = typeof coaches.$inferSelect;
export type InsertExpenditure = z.infer<typeof insertExpenditureSchema>;
export type Expenditure = typeof expenditures.$inferSelect;
export type InsertFeePayment = z.infer<typeof insertFeePaymentSchema>;
export type FeePayment = typeof feePayments.$inferSelect;
export type InsertSalaryPayment = z.infer<typeof insertSalaryPaymentSchema>;
export type SalaryPayment = typeof salaryPayments.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertIncomeRecord = z.infer<typeof insertIncomeRecordSchema>;
export type IncomeRecord = typeof incomeRecords.$inferSelect;
