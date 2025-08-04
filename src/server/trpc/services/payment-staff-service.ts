import { db } from "@/server/db";
import { users, transactions, syncLogs } from "@/server/db/schema";
import { eq, and, desc, gte, lte, sql, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { 
  CreateDepositInput, 
  ManualDepositInput, 
  DailyReportFilters, 
  StudentLookupInput,
  OfflineTransaction 
} from "../validators/payment-staff-validator";
import { TransactionService } from "./transactions-service";
import { tree } from "next/dist/build/templates/app-page";

export class PaymentService {
  /**
   * Create a deposit transaction for a student
   */
  static async createDeposit(input: CreateDepositInput, processedById: string) {
    const [ user ] = await db.select().from(users).where(eq(users.cin, input.cin)).limit(1);

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Student not found with this CIN',
      });
    }
    // First, find the user by CIN
    const tr = await TransactionService.createTransaction({
        userId: user.id,
        type: 'balance_recharge',
        amount: input.amount,
        processedBy: processedById,
        });
    
    return tr;
  }

  /**
   * Get student by CIN for balance lookup
   */
  static async getStudentByCin(input: StudentLookupInput) {
    const user = await db.select({
      id: users.id,
      cin: users.cin,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      balance: users.balance,
      isActive: users.isActive,
      lastLogin: users.lastLogin,
    }).from(users).where(eq(users.cin, input.cin)).limit(1);
    
    if (!user.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Student not found with this CIN',
      });
    }

    return user[0];
  }

  /**
   * Get daily collection summary for payment staff
   */
  static async getDailyCollectionSummary(date: Date, staffId: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [summary] = await db.select({
      totalAmount: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      transactionCount: count(transactions.id),
    }).from(transactions)
      .where(and(
        eq(transactions.processedBy, staffId),
        eq(transactions.type, 'balance_recharge'),
        gte(transactions.createdAt, startOfDay),
        lte(transactions.createdAt, endOfDay)
      ));

    return {
      date,
      totalAmount: summary.totalAmount || 0,
      transactionCount: summary.transactionCount || 0,
      startTime: startOfDay,
      endTime: endOfDay,
    };
  }

  /**
   * Get recent transactions for payment staff
   */
  static async getRecentTransactions(staffId: string, limit: number = 10) {
    const recentTransactions = await db.select({
      id: transactions.id,
      amount: transactions.amount,
      createdAt: transactions.createdAt,
      studentCin: users.cin,
      studentFirstName: users.firstName,
      studentLastName: users.lastName,
    }).from(transactions)
      .innerJoin(users, eq(transactions.userId, users.id))
      .where(and(
        eq(transactions.processedBy, staffId),
        eq(transactions.type, 'balance_recharge')
      ))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);

    return recentTransactions;
  }

  /**
   * Get daily report with filters
   */
  static async getDailyReport(filters: DailyReportFilters) {
    const startOfDay = new Date(filters.date || new Date());
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(filters.date || new Date());
    endOfDay.setHours(23, 59, 59, 999);

    let whereConditions = [
      eq(transactions.type, 'balance_recharge'),
      gte(transactions.createdAt, startOfDay),
      lte(transactions.createdAt, endOfDay)
    ];

    if (filters.staffId) {
      whereConditions.push(eq(transactions.processedBy, filters.staffId));
    }

    if (filters.minAmount) {
      whereConditions.push(gte(transactions.amount, filters.minAmount));
    }

    if (filters.maxAmount) {
      whereConditions.push(lte(transactions.amount, filters.maxAmount));
    }

    const reportData = await db.query.transactions.findMany({
      where: and(...whereConditions),
      orderBy: desc(transactions.createdAt),
      limit: filters.limit,
      offset: filters.offset,
      with: {
        processedByUser: true,
        user:true
      }
    })

    // Get total count for pagination
    const [{ count: totalCount }] = await db.select({
      count: sql<number>`COUNT(*)`
    }).from(transactions)
      .innerJoin(users, eq(transactions.processedBy, users.id))
      .where(and(...whereConditions));

    return {
      transactions: reportData,
      totalCount: totalCount || 0,
      currentPage: Math.floor(filters.offset / filters.limit) + 1,
      totalPages: Math.ceil((totalCount || 0) / filters.limit),
    };
  }

  /**
   * Process offline transactions (sync when back online)
   */
  static async processOfflineTransactions(offlineTransactions: OfflineTransaction[], staffId: string) {
    const results = [];

    for (const offlineTx of offlineTransactions) {
      try {
        const result = await this.createDeposit({
          cin: offlineTx.cin,
          amount: offlineTx.amount,
        }, staffId);

        results.push({
          id: offlineTx.id,
          success: true,
          transaction: result.transaction,
        });

        // Log successful sync
        await db.insert(syncLogs).values({
          userId: staffId,
          syncType: 'push',
          success: true,
          recordsAffected: 1,
        });

      } catch (error) {
        results.push({
          id: offlineTx.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        // Log failed sync
        await db.insert(syncLogs).values({
          userId: staffId,
          syncType: 'push',
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          recordsAffected: 0,
        });
      }
    }

    return results;
  }

  /**
   * Get cash register summary for end-of-day
   */
  static async getCashRegisterSummary(date: Date, staffId: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [summary] = await db.select({
      totalDeposits: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      transactionCount: count(transactions.id),
    }).from(transactions)
      .where(and(
        eq(transactions.processedBy, staffId),
        eq(transactions.type, 'balance_recharge'),
        gte(transactions.createdAt, startOfDay),
        lte(transactions.createdAt, endOfDay)
      ));

    return {
      date,
      totalDeposits: summary.totalDeposits || 0,
      transactionCount: summary.transactionCount || 0,
    };
  }
}