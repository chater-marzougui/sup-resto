import { TRPCError } from "@trpc/server";
import { eq, and, gte, lte, sql, desc, asc, lt } from "drizzle-orm";
import { db } from "@/server/db";
import { mealSchedules, transactions, users } from "@/server/db/schema";
import type {
  CreateTransactionInput,
  BulkScheduleInput,
  RefundTransactionInput,
  BalanceAdjustmentInput,
  TransactionStatsInput,
  BulkBalanceUpdateInput,
  UserTransactionHistoryInput,
  CursorTransactionsInput,
  GetAllTransactionsType,
} from "../validators/transactions-validator";
import { MealCosts } from "@/config/global-config";
import { MealService } from "./meal-service";

export class TransactionService {
  /**
   * Create a new transaction and update user balance
   */
  static async createTransaction(input: CreateTransactionInput) {
    return await db.transaction(async (tx) => {
      console.log("Creating transaction:", input);
      try {
        const user = await tx.query.users.findFirst({
            where: eq(users.id, input.userId),
            columns: { balance: true },
            });

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        const currentBalance = user.balance;
        let newBalance = currentBalance;
        let amount = Math.floor(input.amount);
        console.log("Processing transaction:", {
          userId: input.userId,
          type: input.type,
          amount,
          processedBy: input.processedBy,
        });
        
        if(input.type === 'meal_schedule') {
          console.log("Meal schedule transaction detected");
          amount = - Math.floor(input.amount);
          newBalance = currentBalance + amount;
          console.log("New balance after meal schedule:", newBalance);
          console.log("Meal cost:", amount);
        } else if (input.type === 'balance_adjustment') {
          const adjustment = amount - currentBalance;
          newBalance = amount;
          amount = adjustment;
        } else {
          newBalance = currentBalance + amount;
        }

        // Create transaction record
        const [transaction] = await tx
          .insert(transactions)
          .values({
            userId: input.userId,
            type: input.type,
            amount: amount,
            processedBy: input.processedBy,
            createdAt: new Date(),
          })
          .returning();

        // Update user balance
        await tx
          .update(users)
          .set({ 
            balance: newBalance,
            updatedAt: new Date()
          })
          .where(eq(users.id, input.userId));

        return {
          transaction,
          previousBalance: currentBalance,
          newBalance,
        };
      } catch (error) {
        throw error;
      }
    });
  }

  /**
   * Process bulk meal credit Schedule
   */
  static async processBulkSchedule(input: BulkScheduleInput) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, input.userId),
      columns: { balance: true, role: true },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    const MEAL_COST = MealCosts[user.role] || 200;
    const totalCost = input.amount * MEAL_COST;

    if (user.balance < totalCost) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Insufficient balance for meals schedule',
      });
    }

    return await this.createTransaction({
      userId: input.userId,
      type: 'meal_schedule',
      amount: totalCost,
      processedBy: input.processedBy,
    });
  }

  /**
   * Process refund transaction
   */
  static async processRefund(input: RefundTransactionInput) {
    const meal = await db.query.mealSchedules.findFirst({
      where: eq(mealSchedules.id, input.scheduledMealId),
    });

    if (!meal) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Meal not found',
      });
    }

    if (meal.status !== 'scheduled') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Only scheduled meals can be refunded',
      });
    }

    // if the meal is 3 hours or less away, cancel the meal instead of refunding
    const mealDate = new Date(meal.scheduledDate);
    const now = new Date();
    const timeDifference = mealDate.getTime() - now.getTime();

    if (timeDifference <= 3 * 60 * 60 * 1000) {
      // If the meal is 3 hours or less away, cancel the meal
      await db
        .update(mealSchedules)
        .set({ status: 'cancelled' })
        .where(eq(mealSchedules.id, input.scheduledMealId));

      input.amount = 0; // No refund, just cancellation
    }

    return await this.createTransaction({
      userId: input.userId,
      type: "refund",
      amount: input.amount,
      processedBy: input.processedBy,
    });
  }

  /**
   * Process balance adjustment (admin only)
   */
  static async adjustBalance(input: BalanceAdjustmentInput) {
    return await this.createTransaction({
      userId: input.userId,
      type: 'balance_adjustment',
      amount: input.amount,
      processedBy: input.processedBy,
    });
  }

  static async redeemMeal(userId: string ) {
    // Check if user has a scheduled meal
    const meal = await db.query.mealSchedules.findFirst({
      where: and(
        eq(mealSchedules.userId, userId),
        eq(mealSchedules.status, 'scheduled'),
        gte(mealSchedules.scheduledDate, new Date(Date.now() -  30 * 60 * 1000)), // At least half hours ago
        lte(mealSchedules.scheduledDate, new Date(Date.now() + 3 * 60 * 60 * 1000)) // Within the next 3 hours
      ),
      orderBy: desc(mealSchedules.scheduledDate),
    });

    if (!meal) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No scheduled meal found for redemption',
      });
    }

    return await MealService.updateMealStatus({
      mealId: meal.id,
      status: 'redeemed',
    });
  }

  /**
   * Get user transaction history
   */
  static async getUserTransactionHistory(input: UserTransactionHistoryInput) {
    const conditions = [eq(transactions.userId, input.userId)];

    if (input.type) {
      conditions.push(eq(transactions.type, input.type));
    }

    const userTransactions = await db.query.transactions.findMany({
        where: and(...conditions),
        with: {
          processedByUser: {
            columns: {
              id: true,
              role: true,
            },
          },
        },
        orderBy: desc(transactions.createdAt),
        limit: input.limit,
        offset: input.offset,
    });

    return userTransactions;
  }

  /**
   * Get all transactions with filters and pagination (admin only)
   */

  static async getAllTransactions(input: CursorTransactionsInput): Promise<GetAllTransactionsType> {
  const conditions = [];
  
  if (input.userId) {
    conditions.push(eq(transactions.userId, input.userId));
  }
  if (input.type) {
    conditions.push(eq(transactions.type, input.type));
  }
  if (input.startDate) {
    conditions.push(gte(transactions.createdAt, input.startDate));
  }
  if (input.endDate) {
    conditions.push(lte(transactions.createdAt, input.endDate));
  }
  if (input.processedBy) {
    conditions.push(eq(transactions.processedBy, input.processedBy));
  }
  if (input.minAmount) {
    conditions.push(gte(sql`CAST(${transactions.amount} AS DECIMAL)`, input.minAmount));
  }
  if (input.maxAmount) {
    conditions.push(lte(sql`CAST(${transactions.amount} AS DECIMAL)`, input.maxAmount));
  }

  // Add cursor condition if provided
  if (input.cursor) {
    conditions.push(lt(transactions.id, input.cursor));
  }

  // Get one extra record to check if there's a next page

  const transactionsList = await db.query.transactions.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: desc(transactions.createdAt),  
    limit: input.limit + 1,
    with: {
      processedByUser: {
        columns: {
          id: true,
          role: true,
        },
      },
    }
  });

  // Check if there are more records
  const hasNextPage = transactionsList.length > input.limit;
  
  // Remove the extra record if it exists
  let nextCursor = undefined;
  if (hasNextPage) {
    const el = transactionsList.pop();
    nextCursor = el?.id;
  }

  return {
    transactions: transactionsList,
    hasNextPage,
    nextCursor,
  };
}

  /**
   * Get transaction statistics
   */
  static async getTransactionStats(input: TransactionStatsInput) {
    const conditions = [];

    if (input.startDate) {
      conditions.push(gte(transactions.createdAt, input.startDate));
    }

    if (input.endDate) {
      conditions.push(lte(transactions.createdAt, input.endDate));
    }

    // Get transaction summary by type
    const transactionSummary = await db
      .select({
        type: transactions.type,
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(CAST(${transactions.amount} AS DECIMAL))`,
      })
      .from(transactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(transactions.type);

    // Get daily/weekly/monthly breakdown
    let dateFormat = '';
    switch (input.groupBy) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        dateFormat = 'YYYY-"W"WW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
    }

    const timeSeriesData = await db
      .select({
        period: sql<string>`to_char(${transactions.createdAt}, '${dateFormat}')`,
        transactionCount: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(CAST(${transactions.amount} AS DECIMAL))`,
      })
      .from(transactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(sql`to_char(${transactions.createdAt}, '${dateFormat}')`)
      .orderBy(sql`to_char(${transactions.createdAt}, '${dateFormat}')`);

    return {
      transactionSummary,
      timeSeriesData,
    };
  }

  /**
   * Process bulk balance updates (admin only)
   */
  static async processBulkBalanceUpdate(input: BulkBalanceUpdateInput) {
    return await db.transaction(async (tx) => {
      const results = [];

      for (const update of input.updates) {
        try {
          const result = await this.createTransaction({
            userId: update.userId,
            type: 'balance_adjustment',
            amount: update.amount,
            processedBy: input.processedBy,
          });
          
          results.push({
            userId: update.userId,
            success: true,
            result,
          });
        } catch (error) {
          results.push({
            userId: update.userId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return results;
    });
  }

  /**
   * Get transaction by ID
   */
  static async getTransactionById(transactionId: string) {
    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, transactionId),
      with: {
        user: {
          columns: {
            firstName: true,
            lastName: true,
            cin: true,
          },
        },
        processedByUser: {
          columns: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Transaction not found',
      });
    }

    return transaction;
  }

  /**
   * Get low balance users (admin only)
   */
  static async getLowBalanceUsers(threshold: number = 0) {
    const lowBalanceUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        cin: users.cin,
        balance: users.balance,
        role: users.role,
      })
      .from(users)
      .where(
        and(
          lte(users.balance, threshold),
          eq(users.isActive, true)
        )
      )
      .orderBy(asc(users.balance));

    return lowBalanceUsers;
  }
}