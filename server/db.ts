import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, expenses, investments, Expense, Investment, InsertExpense, InsertInvestment } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Expense queries
export async function createExpense(expense: InsertExpense): Promise<Expense | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(expenses).values(expense);
  const id = (result as any).insertId;
  return db.select().from(expenses).where(eq(expenses.id, id)).limit(1).then(r => r[0] || null);
}

export async function getUserExpenses(userId: number, month?: Date): Promise<Expense[]> {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(expenses).where(eq(expenses.userId, userId));
  
  if (month) {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
    query = db.select().from(expenses).where(
      and(
        eq(expenses.userId, userId),
        // @ts-ignore
        db.raw(`DATE(date) >= ? AND DATE(date) <= ?`, [startOfMonth, endOfMonth])
      )
    );
  }
  
  return query.orderBy(desc(expenses.date));
}

export async function deleteExpense(expenseId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  await db.delete(expenses).where(eq(expenses.id, expenseId));
  return true;
}

// Investment queries
export async function createInvestment(investment: InsertInvestment): Promise<Investment | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(investments).values(investment);
  const id = (result as any).insertId;
  return db.select().from(investments).where(eq(investments.id, id)).limit(1).then(r => r[0] || null);
}

export async function getUserInvestments(userId: number): Promise<Investment[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(investments).where(eq(investments.userId, userId)).orderBy(desc(investments.createdAt));
}

export async function updateInvestment(investmentId: number, updates: Partial<InsertInvestment>): Promise<Investment | null> {
  const db = await getDb();
  if (!db) return null;
  
  await db.update(investments).set(updates).where(eq(investments.id, investmentId));
  return db.select().from(investments).where(eq(investments.id, investmentId)).limit(1).then(r => r[0] || null);
}

export async function deleteInvestment(investmentId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  await db.delete(investments).where(eq(investments.id, investmentId));
  return true;
}
