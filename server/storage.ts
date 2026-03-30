import {
  type User, type InsertUser,
  type Player, type InsertPlayer,
  type Family, type InsertFamily,
  type Coach, type InsertCoach,
  type Expenditure, type InsertExpenditure,
  type FeePayment, type InsertFeePayment,
  type SalaryPayment, type InsertSalaryPayment,
  type Session, type InsertSession,
  type Attendance,
  type IncomeRecord, type InsertIncomeRecord,
  users, players, families, coaches, expenditures, feePayments, salaryPayments,
  sessions, attendance, incomeRecords,
  calculateAge, getAgeGroup,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, sql, or, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  countUsers(): Promise<number>;

  getFamilies(): Promise<Family[]>;
  getFamily(id: string): Promise<Family | undefined>;
  createFamily(family: InsertFamily): Promise<Family>;
  updateFamily(id: string, family: Partial<InsertFamily>): Promise<Family | undefined>;
  deleteFamily(id: string): Promise<boolean>;
  getFamilyMembers(familyId: string): Promise<Player[]>;
  collectFamilyFees(familyId: string, month: string, year: number, totalAmount: number): Promise<FeePayment[]>;

  getPlayers(): Promise<Player[]>;
  getPlayer(id: string): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: string, player: Partial<InsertPlayer>): Promise<Player | undefined>;
  deletePlayer(id: string): Promise<boolean>;
  searchPlayers(query: string): Promise<Player[]>;

  getCoaches(): Promise<Coach[]>;
  getCoach(id: string): Promise<Coach | undefined>;
  createCoach(coach: InsertCoach): Promise<Coach>;
  updateCoach(id: string, coach: Partial<InsertCoach>): Promise<Coach | undefined>;
  deleteCoach(id: string): Promise<boolean>;

  getExpenditures(): Promise<Expenditure[]>;
  getExpenditure(id: string): Promise<Expenditure | undefined>;
  createExpenditure(expenditure: InsertExpenditure): Promise<Expenditure>;
  updateExpenditure(id: string, expenditure: Partial<InsertExpenditure>): Promise<Expenditure | undefined>;
  deleteExpenditure(id: string): Promise<boolean>;

  getFeePayments(): Promise<FeePayment[]>;
  getFeePayment(id: string): Promise<FeePayment | undefined>;
  createFeePayment(payment: InsertFeePayment): Promise<FeePayment>;
  updateFeePayment(id: string, payment: Partial<InsertFeePayment>): Promise<FeePayment | undefined>;
  deleteFeePayment(id: string): Promise<boolean>;

  getSalaryPayments(): Promise<SalaryPayment[]>;
  getSalaryPayment(id: string): Promise<SalaryPayment | undefined>;
  createSalaryPayment(payment: InsertSalaryPayment): Promise<SalaryPayment>;
  updateSalaryPayment(id: string, payment: Partial<InsertSalaryPayment>): Promise<SalaryPayment | undefined>;
  deleteSalaryPayment(id: string): Promise<boolean>;

  getSessions(): Promise<Session[]>;
  getSession(id: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  deleteSession(id: string): Promise<boolean>;
  getSessionAttendance(sessionId: string): Promise<(Attendance & { playerName: string; playerNameAr: string | null; playerCode: string | null; ageGroup: string; playerStatus: string })[]>;
  saveSessionAttendance(sessionId: string, records: { playerId: string; present: boolean }[]): Promise<Attendance[]>;

  getIncomeRecords(): Promise<IncomeRecord[]>;
  createIncomeRecord(record: InsertIncomeRecord): Promise<IncomeRecord>;
  deleteIncomeRecord(id: string): Promise<boolean>;

  getDashboardStats(month?: string, year?: number): Promise<{
    totalPlayers: number;
    activePlayers: number;
    totalCoaches: number;
    totalFeesCollected: number;
    totalExpenditure: number;
    totalSalaries: number;
    feesPaidCount: number;
    feesUnpaidCount: number;
    attendanceCount: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async listUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(users.username);
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async countUsers(): Promise<number> {
    const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    return row?.count ?? 0;
  }

  async getFamilies(): Promise<Family[]> {
    return db.select().from(families).orderBy(desc(families.createdAt));
  }

  async getFamily(id: string): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.id, id));
    return family;
  }

  async createFamily(family: InsertFamily): Promise<Family> {
    const [created] = await db.insert(families).values(family).returning();
    return created;
  }

  async updateFamily(id: string, family: Partial<InsertFamily>): Promise<Family | undefined> {
    const [updated] = await db.update(families).set(family).where(eq(families.id, id)).returning();
    return updated;
  }

  async deleteFamily(id: string): Promise<boolean> {
    await db.update(players).set({ familyId: null }).where(eq(players.familyId, id));
    const result = await db.delete(families).where(eq(families.id, id)).returning();
    return result.length > 0;
  }

  async getFamilyMembers(familyId: string): Promise<Player[]> {
    return db.select().from(players).where(eq(players.familyId, familyId)).orderBy(players.name);
  }

  async collectFamilyFees(familyId: string, month: string, year: number, totalAmount: number): Promise<FeePayment[]> {
    const members = await db.select().from(players)
      .where(and(eq(players.familyId, familyId), eq(players.status, "active")));
    if (members.length === 0) return [];

    const perMember = (totalAmount / members.length).toFixed(2);
    const today = new Date().toISOString().split("T")[0];
    const created: FeePayment[] = [];
    for (const member of members) {
      const [payment] = await db.insert(feePayments).values({
        playerId: member.id,
        amount: perMember,
        month,
        year,
        status: "paid",
        paidDate: today,
      }).returning();
      created.push(payment);
    }
    return created;
  }

  async getPlayers(): Promise<Player[]> {
    return db.select().from(players).orderBy(desc(players.createdAt));
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player;
  }

  private getAgeGroupPrefix(ageGroup: string): string {
    const map: Record<string, string> = {
      "U-8": "08", "U-10": "10", "U-12": "12", "U-14": "14",
      "U-16": "16", "U-18": "18", "Senior": "99",
    };
    return map[ageGroup] || "00";
  }

  private async generatePlayerCode(ageGroup: string): Promise<string> {
    const prefix = this.getAgeGroupPrefix(ageGroup);
    const existing = await db
      .select({ playerCode: players.playerCode })
      .from(players)
      .where(sql`${players.playerCode} LIKE ${prefix + '%'}`);
    const usedNumbers = existing
      .map((p) => p.playerCode ? parseInt(p.playerCode.slice(2), 10) : 0)
      .filter((n) => !isNaN(n));
    let next = 1;
    while (usedNumbers.includes(next) && next < 100) next++;
    return prefix + String(next).padStart(2, "0");
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const age = calculateAge(player.dateOfBirth);
    const ageGroup = getAgeGroup(age);
    const playerCode = await this.generatePlayerCode(ageGroup);
    const [created] = await db.insert(players).values({ ...player, age, ageGroup, playerCode }).returning();
    return created;
  }

  async updatePlayer(id: string, player: Partial<InsertPlayer>): Promise<Player | undefined> {
    const updates: Record<string, any> = { ...player };
    if (player.dateOfBirth) {
      updates.age = calculateAge(player.dateOfBirth);
      updates.ageGroup = getAgeGroup(updates.age);
    }
    const [updated] = await db.update(players).set(updates).where(eq(players.id, id)).returning();
    return updated;
  }

  async deletePlayer(id: string): Promise<boolean> {
    const result = await db.delete(players).where(eq(players.id, id)).returning();
    return result.length > 0;
  }

  async searchPlayers(query: string): Promise<Player[]> {
    return db.select().from(players).where(
      or(
        ilike(players.name, `%${query}%`),
        sql`${players.playerCode} ILIKE ${`%${query}%`}`
      )
    ).orderBy(desc(players.createdAt));
  }

  async getCoaches(): Promise<Coach[]> {
    return db.select().from(coaches).orderBy(desc(coaches.createdAt));
  }

  async getCoach(id: string): Promise<Coach | undefined> {
    const [coach] = await db.select().from(coaches).where(eq(coaches.id, id));
    return coach;
  }

  async createCoach(coach: InsertCoach): Promise<Coach> {
    const [created] = await db.insert(coaches).values(coach).returning();
    return created;
  }

  async updateCoach(id: string, coach: Partial<InsertCoach>): Promise<Coach | undefined> {
    const [updated] = await db.update(coaches).set(coach).where(eq(coaches.id, id)).returning();
    return updated;
  }

  async deleteCoach(id: string): Promise<boolean> {
    const result = await db.delete(coaches).where(eq(coaches.id, id)).returning();
    return result.length > 0;
  }

  async getExpenditures(): Promise<Expenditure[]> {
    return db.select().from(expenditures).orderBy(desc(expenditures.createdAt));
  }

  async getExpenditure(id: string): Promise<Expenditure | undefined> {
    const [exp] = await db.select().from(expenditures).where(eq(expenditures.id, id));
    return exp;
  }

  async createExpenditure(expenditure: InsertExpenditure): Promise<Expenditure> {
    const [created] = await db.insert(expenditures).values(expenditure).returning();
    return created;
  }

  async updateExpenditure(id: string, expenditure: Partial<InsertExpenditure>): Promise<Expenditure | undefined> {
    const [updated] = await db.update(expenditures).set(expenditure).where(eq(expenditures.id, id)).returning();
    return updated;
  }

  async deleteExpenditure(id: string): Promise<boolean> {
    const result = await db.delete(expenditures).where(eq(expenditures.id, id)).returning();
    return result.length > 0;
  }

  async getFeePayments(): Promise<FeePayment[]> {
    return db.select().from(feePayments).orderBy(desc(feePayments.createdAt));
  }

  async getFeePayment(id: string): Promise<FeePayment | undefined> {
    const [payment] = await db.select().from(feePayments).where(eq(feePayments.id, id));
    return payment;
  }

  async createFeePayment(payment: InsertFeePayment): Promise<FeePayment> {
    const [created] = await db.insert(feePayments).values(payment).returning();
    return created;
  }

  async updateFeePayment(id: string, payment: Partial<InsertFeePayment>): Promise<FeePayment | undefined> {
    const [updated] = await db.update(feePayments).set(payment).where(eq(feePayments.id, id)).returning();
    return updated;
  }

  async deleteFeePayment(id: string): Promise<boolean> {
    const result = await db.delete(feePayments).where(eq(feePayments.id, id)).returning();
    return result.length > 0;
  }

  async getSalaryPayments(): Promise<SalaryPayment[]> {
    return db.select().from(salaryPayments).orderBy(desc(salaryPayments.createdAt));
  }

  async getSalaryPayment(id: string): Promise<SalaryPayment | undefined> {
    const [payment] = await db.select().from(salaryPayments).where(eq(salaryPayments.id, id));
    return payment;
  }

  async createSalaryPayment(payment: InsertSalaryPayment): Promise<SalaryPayment> {
    const [created] = await db.insert(salaryPayments).values(payment).returning();
    return created;
  }

  async updateSalaryPayment(id: string, payment: Partial<InsertSalaryPayment>): Promise<SalaryPayment | undefined> {
    const [updated] = await db.update(salaryPayments).set(payment).where(eq(salaryPayments.id, id)).returning();
    return updated;
  }

  async deleteSalaryPayment(id: string): Promise<boolean> {
    const result = await db.delete(salaryPayments).where(eq(salaryPayments.id, id)).returning();
    return result.length > 0;
  }

  async getSessions(): Promise<Session[]> {
    return db.select().from(sessions).orderBy(desc(sessions.date));
  }

  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [created] = await db.insert(sessions).values(session).returning();
    return created;
  }

  async deleteSession(id: string): Promise<boolean> {
    await db.delete(attendance).where(eq(attendance.sessionId, id));
    const result = await db.delete(sessions).where(eq(sessions.id, id)).returning();
    return result.length > 0;
  }

  async getSessionAttendance(sessionId: string) {
    const rows = await db
      .select({
        id: attendance.id,
        sessionId: attendance.sessionId,
        playerId: attendance.playerId,
        present: attendance.present,
        createdAt: attendance.createdAt,
        playerName: players.name,
        playerNameAr: players.nameAr,
        playerCode: players.playerCode,
        ageGroup: players.ageGroup,
        playerStatus: players.status,
      })
      .from(attendance)
      .innerJoin(players, eq(attendance.playerId, players.id))
      .where(eq(attendance.sessionId, sessionId))
      .orderBy(players.name);
    return rows;
  }

  async saveSessionAttendance(sessionId: string, records: { playerId: string; present: boolean }[]): Promise<Attendance[]> {
    await db.delete(attendance).where(eq(attendance.sessionId, sessionId));
    if (records.length === 0) return [];
    const created = await db.insert(attendance).values(
      records.map((r) => ({ sessionId, playerId: r.playerId, present: r.present }))
    ).returning();
    return created;
  }

  async getIncomeRecords(): Promise<IncomeRecord[]> {
    return db.select().from(incomeRecords).orderBy(desc(incomeRecords.date));
  }

  async createIncomeRecord(record: InsertIncomeRecord): Promise<IncomeRecord> {
    const [created] = await db.insert(incomeRecords).values(record).returning();
    return created;
  }

  async deleteIncomeRecord(id: string): Promise<boolean> {
    const result = await db.delete(incomeRecords).where(eq(incomeRecords.id, id)).returning();
    return result.length > 0;
  }

  async getDashboardStats(month?: string, year?: number) {
    const [playerCount] = await db.select({ count: sql<number>`count(*)::int` }).from(players);
    const [activeCount] = await db.select({ count: sql<number>`count(*)::int` }).from(players).where(eq(players.status, "active"));
    const [coachCount] = await db.select({ count: sql<number>`count(*)::int` }).from(coaches);

    const feeWhere = month && year
      ? and(eq(feePayments.status, "paid"), eq(feePayments.month, month), eq(feePayments.year, year))
      : eq(feePayments.status, "paid");

    const feePendingWhere = month && year
      ? and(eq(feePayments.status, "pending"), eq(feePayments.month, month), eq(feePayments.year, year))
      : eq(feePayments.status, "pending");

    const [feeTotal] = await db.select({ total: sql<number>`coalesce(sum(amount::numeric), 0)::float` }).from(feePayments).where(feeWhere);
    const [feePaidCount] = await db.select({ count: sql<number>`count(*)::int` }).from(feePayments).where(feeWhere);
    const [feePendingCount] = await db.select({ count: sql<number>`count(*)::int` }).from(feePayments).where(feePendingWhere);

    const expWhere = month && year
      ? sql`EXTRACT(YEAR FROM ${expenditures.date}) = ${year} AND TO_CHAR(${expenditures.date}, 'Month') ILIKE ${month + '%'}`
      : undefined;

    const [expTotal] = expWhere
      ? await db.select({ total: sql<number>`coalesce(sum(amount::numeric), 0)::float` }).from(expenditures).where(expWhere)
      : await db.select({ total: sql<number>`coalesce(sum(amount::numeric), 0)::float` }).from(expenditures);

    const salWhere = month && year
      ? and(eq(salaryPayments.status, "paid"), eq(salaryPayments.month, month), eq(salaryPayments.year, year))
      : eq(salaryPayments.status, "paid");

    const [salTotal] = await db.select({ total: sql<number>`coalesce(sum(amount::numeric), 0)::float` }).from(salaryPayments).where(salWhere);

    const attWhere = month && year
      ? sql`EXTRACT(YEAR FROM ${sessions.date}) = ${year} AND TO_CHAR(${sessions.date}, 'Month') ILIKE ${month + '%'}`
      : undefined;

    const [attCount] = attWhere
      ? await db.select({ count: sql<number>`count(*)::int` }).from(sessions).where(attWhere)
      : await db.select({ count: sql<number>`count(*)::int` }).from(sessions);

    return {
      totalPlayers: playerCount.count,
      activePlayers: activeCount.count,
      totalCoaches: coachCount.count,
      totalFeesCollected: feeTotal.total,
      totalExpenditure: expTotal.total,
      totalSalaries: salTotal.total,
      feesPaidCount: feePaidCount.count,
      feesUnpaidCount: feePendingCount.count,
      attendanceCount: attCount.count,
    };
  }
}

export const storage = new DatabaseStorage();
