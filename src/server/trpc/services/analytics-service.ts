import { TRPCError } from "@trpc/server";
import { eq, and, gte, lte, sql, desc, asc, count, avg, sum, inArray } from "drizzle-orm";
import { db } from "@/server/db";
import { mealSchedules, transactions, users } from "@/server/db/schema";
import type {
  UserSpendingAnalyticsInput,
  MealPatternAnalyticsInput,
  BalanceHistoryInput,
  MonthlySpendingInput,
  ComparativeAnalyticsInput,
  SystemAnalyticsInput,
  TimeRangeInput,
  TopSpendersInput,
  MealTrendsInput,
} from "../validators/analytics-validator";
import { MealCosts } from "@/config/global-config";
import { RoleEnum } from "@/server/db/enums";
import { getRoleNameByNumber } from "@/lib/utils/main-utils";

const validateUserId = (userId: string | undefined | null): string => {
    if (!userId || userId.trim() === "") {
        throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User ID is required",
        });
    }
    return userId;
};

export class AnalyticsService {
  /**
   * Get user's spending analytics
   */
  static async getUserSpendingAnalytics(input: UserSpendingAnalyticsInput) {
    const { startDate, endDate, groupBy = 'day' } = input;

    const userId = validateUserId(input.userId);
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { balance: true, role: true, createdAt: true },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    // Get spending transactions
    const spendingTransactions = await db
      .select({
        date: sql<string>`DATE(${transactions.createdAt})`,
        totalSpent: sql<number>`CAST(SUM(CASE WHEN ${transactions.type} IN ('meal_schedule', 'meal_redemption') THEN ${transactions.amount} ELSE 0 END) AS INTEGER)`,
        totalRecharged: sql<number>`CAST(SUM(CASE WHEN ${transactions.type} = 'balance_recharge' THEN ${transactions.amount} ELSE 0 END) AS INTEGER)`,
        transactionCount: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          startDate ? gte(transactions.createdAt, startDate) : undefined,
          endDate ? lte(transactions.createdAt, endDate) : undefined
        )
      )
      .groupBy(sql`DATE(${transactions.createdAt})`)
      .orderBy(sql`DATE(${transactions.createdAt})`);

    // Calculate totals
    const totals = await db
      .select({
        totalSpent: sql<number>`CAST(SUM(CASE WHEN ${transactions.type} IN ('meal_schedule', 'meal_redemption') THEN ${transactions.amount} ELSE 0 END) AS INTEGER)`,
        totalRecharged: sql<number>`CAST(SUM(CASE WHEN ${transactions.type} = 'balance_recharge' THEN ${transactions.amount} ELSE 0 END) AS INTEGER)`,
        totalTransactions: count(),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          startDate ? gte(transactions.createdAt, startDate) : undefined,
          endDate ? lte(transactions.createdAt, endDate) : undefined
        )
      );

    return {
      currentBalance: user.balance,
      dailySpending: spendingTransactions,
      totals: totals[0],
      userRole: user.role,
      accountAge: Math.floor((new Date().getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    };
  }

  /**
   * Get meal pattern analytics
   */
  static async getMealPatternAnalytics(input: MealPatternAnalyticsInput) {
    const { startDate, endDate } = input;
    
    const userId = validateUserId(input.userId);

    // Get meal consumption patterns
    const mealPatterns = await db
      .select({
        mealTime: mealSchedules.mealTime,
        dayOfWeek: sql<number>`EXTRACT(DOW FROM ${mealSchedules.scheduledDate})`,
        totalMeals: count(),
        redeemedMeals: sql<number>`COUNT(CASE WHEN ${mealSchedules.status} = 'redeemed' THEN 1 END)`,
        cancelledMeals: sql<number>`COUNT(CASE WHEN ${mealSchedules.status} = 'cancelled' THEN 1 END)`,
        expiredMeals: sql<number>`COUNT(CASE WHEN ${mealSchedules.status} = 'expired' THEN 1 END)`,
      })
      .from(mealSchedules)
      .where(
        and(
          eq(mealSchedules.userId, userId),
          startDate ? gte(mealSchedules.scheduledDate, startDate) : undefined,
          endDate ? lte(mealSchedules.scheduledDate, endDate) : undefined
        )
      )
      .groupBy(mealSchedules.mealTime, sql`EXTRACT(DOW FROM ${mealSchedules.scheduledDate})`);

    // Get monthly meal counts
    const monthlyPatterns = await db
      .select({
        month: sql<string>`DATE_TRUNC('month', ${mealSchedules.scheduledDate})`,
        mealTime: mealSchedules.mealTime,
        totalMeals: count(),
        redeemedMeals: sql<number>`COUNT(CASE WHEN ${mealSchedules.status} = 'redeemed' THEN 1 END)`,
      })
      .from(mealSchedules)
      .where(
        and(
          eq(mealSchedules.userId, userId),
          startDate ? gte(mealSchedules.scheduledDate, startDate) : undefined,
          endDate ? lte(mealSchedules.scheduledDate, endDate) : undefined
        )
      )
      .groupBy(sql`DATE_TRUNC('month', ${mealSchedules.scheduledDate})`, mealSchedules.mealTime)
      .orderBy(sql`DATE_TRUNC('month', ${mealSchedules.scheduledDate})`);

    // Calculate efficiency metrics
    const efficiencyMetrics = await db
      .select({
        totalScheduled: count(),
        totalRedeemed: sql<number>`COUNT(CASE WHEN ${mealSchedules.status} = 'redeemed' THEN 1 END)`,
        totalWasted: sql<number>`COUNT(CASE WHEN ${mealSchedules.status} IN ('cancelled', 'expired') THEN 1 END)`,
      })
      .from(mealSchedules)
      .where(
        and(
          eq(mealSchedules.userId, userId),
          startDate ? gte(mealSchedules.scheduledDate, startDate) : undefined,
          endDate ? lte(mealSchedules.scheduledDate, endDate) : undefined
        )
      );

    const efficiency = efficiencyMetrics[0];
    const redemptionRate = efficiency.totalScheduled > 0 
      ? (efficiency.totalRedeemed / efficiency.totalScheduled) * 100 
      : 0;
    const wasteRate = efficiency.totalScheduled > 0 
      ? (efficiency.totalWasted / efficiency.totalScheduled) * 100 
      : 0;

    return {
      mealPatterns,
      monthlyPatterns,
      efficiencyMetrics: {
        ...efficiency,
        redemptionRate,
        wasteRate,
      },
    };
  }

  /**
   * Get balance history
   */
  static async getBalanceHistory(input: BalanceHistoryInput) {
    const { startDate, endDate, limit = 50 } = input;
    
    const userId = validateUserId(input.userId);

    const balanceHistory = await db
      .select({
        date: transactions.createdAt,
        type: transactions.type,
        amount: transactions.amount,
        runningBalance: sql<number>`
          SUM(CASE 
            WHEN ${transactions.type} IN ('balance_recharge', 'refund', 'balance_adjustment') THEN CAST(${transactions.amount} AS INTEGER)
            WHEN ${transactions.type} IN ('meal_schedule') THEN -CAST(${transactions.amount} AS INTEGER)
            ELSE 0 
          END) OVER (ORDER BY ${transactions.createdAt})
        `,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          startDate ? gte(transactions.createdAt, startDate) : undefined,
          endDate ? lte(transactions.createdAt, endDate) : undefined
        )
      )
      .orderBy(desc(transactions.createdAt))
      .limit(limit);

    return {
      balanceHistory,
    };
  }

  /**
   * Get monthly spending breakdown
   */
  static async getMonthlySpending(input: MonthlySpendingInput) {
    const { year, months } = input;
    const userId = validateUserId(input.userId);

    const monthlySpending = await db
      .select({
        month: sql<number>`EXTRACT(MONTH FROM ${transactions.createdAt})`,
        year: sql<number>`EXTRACT(YEAR FROM ${transactions.createdAt})`,
        totalSpent: sql<number>`CAST(SUM(CASE WHEN ${transactions.type} IN ('meal_schedule', 'meal_redemption') THEN ${transactions.amount} ELSE 0 END) AS INTEGER)`,
        totalRecharged: sql<number>`CAST(SUM(CASE WHEN ${transactions.type} = 'balance_recharge' THEN ${transactions.amount} ELSE 0 END) AS INTEGER)`,
        mealTransactions: sql<number>`COUNT(CASE WHEN ${transactions.type} IN ('meal_schedule', 'meal_redemption') THEN 1 END)`,
        rechargeTransactions: sql<number>`COUNT(CASE WHEN ${transactions.type} = 'balance_recharge' THEN 1 END)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          year ? eq(sql`EXTRACT(YEAR FROM ${transactions.createdAt})`, year) : undefined,
          months?.length ? inArray(sql`EXTRACT(MONTH FROM ${transactions.createdAt})`, months) : undefined
        )
      )
      .groupBy(sql`EXTRACT(YEAR FROM ${transactions.createdAt})`, sql`EXTRACT(MONTH FROM ${transactions.createdAt})`)
      .orderBy(sql`EXTRACT(YEAR FROM ${transactions.createdAt})`, sql`EXTRACT(MONTH FROM ${transactions.createdAt})`);

    return {
      monthlySpending,
    };
  }

  /**
   * Get comparative analytics
   */
  static async getComparativeAnalytics(input: ComparativeAnalyticsInput) {
    const { userId, compareWithRole, startDate, endDate } = input;

    const filter = compareWithRole ? [
       eq(users.role, compareWithRole)
    ] : [];

    // Get user's spending
    const userSpending = await db
      .select({
        totalSpent: sql<number>`CAST(SUM(CASE WHEN ${transactions.type} IN ('meal_schedule', 'meal_redemption') THEN ${transactions.amount} ELSE 0 END) AS INTEGER)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          startDate ? gte(transactions.createdAt, startDate) : undefined,
          endDate ? lte(transactions.createdAt, endDate) : undefined
        )
      );

    // Get average spending for similar users (same role)
    const similarUsersSpending = await db
      .select({
        avgSpending: sql<number>`CAST(AVG(user_spending.total_spent) AS INTEGER)`,
        medianSpending: sql<number>`CAST(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY user_spending.total_spent) AS INTEGER)`,
        userCount: count(),
      })
      .from(
        db
          .select({
            userId: transactions.userId,
            totalSpent: sql<number>`CAST(SUM(CASE WHEN ${transactions.type} IN ('meal_schedule', 'meal_redemption') THEN ${transactions.amount} ELSE 0 END) AS INTEGER)`.as('total_spent'),
          })
          .from(transactions)
          .where(
            and(
              ...filter,
              startDate ? gte(transactions.createdAt, startDate) : undefined,
              endDate ? lte(transactions.createdAt, endDate) : undefined
            )
          )
          .groupBy(transactions.userId)
          .as('user_spending')
      );

    const userTotal = userSpending[0]?.totalSpent || 0;
    const avgSpending = similarUsersSpending[0]?.avgSpending || 0;
    const percentile = avgSpending > 0 ? (userTotal / avgSpending) * 100 : 0;

    return {
      userSpending: userTotal,
      averageSpending: avgSpending,
      medianSpending: similarUsersSpending[0]?.medianSpending || 0,
      percentile,
      comparisonGroup: {
        role: compareWithRole ? getRoleNameByNumber(compareWithRole) : 'All Users',
        userCount: similarUsersSpending[0]?.userCount || 0,
      },
    };
  }

  /**
   * Get system-wide analytics
   */
  static async getSystemAnalytics(input: SystemAnalyticsInput) {
    const { startDate, endDate, groupBy = 'day' } = input;

    // Total system metrics
    const systemMetrics = await db
      .select({
        totalUsers: sql<number>`COUNT(DISTINCT ${users.id})`,
        activeUsers: sql<number>`COUNT(DISTINCT CASE WHEN ${users.lastLogin} > NOW() - INTERVAL '30 days' THEN ${users.id} END)`,
        totalBalance: sql<number>`CAST(SUM(${users.balance}) AS INTEGER)`,
      })
      .from(users)
      .where(eq(users.isActive, true));

    // Transaction metrics
    const transactionMetrics = await db
      .select({
        totalTransactions: count(),
        totalVolume: sql<number>`CAST(SUM(${transactions.amount}) AS INTEGER)`,
        avgTransactionSize: sql<number>`CAST(AVG(${transactions.amount}) AS INTEGER)`,
      })
      .from(transactions)
      .where(
        and(
          startDate ? gte(transactions.createdAt, startDate) : undefined,
          endDate ? lte(transactions.createdAt, endDate) : undefined
        )
      );

    // Meal metrics
    const mealMetrics = await db
      .select({
        totalMealsScheduled: count(),
        totalMealsRedeemed: sql<number>`COUNT(CASE WHEN ${mealSchedules.status} = 'redeemed' THEN 1 END)`,
        totalMealsCancelled: sql<number>`COUNT(CASE WHEN ${mealSchedules.status} = 'cancelled' THEN 1 END)`,
        totalMealsExpired: sql<number>`COUNT(CASE WHEN ${mealSchedules.status} = 'expired' THEN 1 END)`,
      })
      .from(mealSchedules)
      .where(
        and(
          startDate ? gte(mealSchedules.scheduledDate, startDate) : undefined,
          endDate ? lte(mealSchedules.scheduledDate, endDate) : undefined
        )
      );

    return {
      systemMetrics: systemMetrics[0],
      transactionMetrics: transactionMetrics[0],
      mealMetrics: mealMetrics[0],
    };
  }

  /**
   * Get top spenders
   */
  static async getTopSpenders(input: TopSpendersInput) {
    const { startDate, endDate, limit = 10, role } = input;

    const topSpenders = await db
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        totalSpent: sql<number>`CAST(SUM(${transactions.amount}) AS INTEGER)`,
        transactionCount: count(),
        currentBalance: users.balance,
      })
      .from(transactions)
      .innerJoin(users, eq(transactions.userId, users.id))
      .where(
        and(
          inArray(transactions.type, ['meal_schedule', 'meal_redemption']),
          startDate ? gte(transactions.createdAt, startDate) : undefined,
          endDate ? lte(transactions.createdAt, endDate) : undefined,
          role !== undefined ? eq(users.role, role) : undefined
        )
      )
      .groupBy(users.id, users.firstName, users.lastName, users.role, users.balance)
      .orderBy(desc(sql`SUM(${transactions.amount})`))
      .limit(limit);

    return {
      topSpenders,
    };
  }

  /**
   * Get meal trends
   */
  static async getMealTrends(input: MealTrendsInput) {
    const { startDate, endDate, groupBy = 'day' } = input;

    const mealTrends = await db
      .select({
        date: sql<string>`DATE_TRUNC('${groupBy}', ${mealSchedules.scheduledDate})`,
        mealTime: mealSchedules.mealTime,
        totalScheduled: count(),
        totalRedeemed: sql<number>`COUNT(CASE WHEN ${mealSchedules.status} = 'redeemed' THEN 1 END)`,
        totalCancelled: sql<number>`COUNT(CASE WHEN ${mealSchedules.status} = 'cancelled' THEN 1 END)`,
        totalExpired: sql<number>`COUNT(CASE WHEN ${mealSchedules.status} = 'expired' THEN 1 END)`,
        redemptionRate: sql<number>`ROUND((COUNT(CASE WHEN ${mealSchedules.status} = 'redeemed' THEN 1 END)::float / COUNT(*)) * 100, 2)`,
      })
      .from(mealSchedules)
      .where(
        and(
          startDate ? gte(mealSchedules.scheduledDate, startDate) : undefined,
          endDate ? lte(mealSchedules.scheduledDate, endDate) : undefined
        )
      )
      .groupBy(sql`DATE_TRUNC('${groupBy}', ${mealSchedules.scheduledDate})`, mealSchedules.mealTime)
      .orderBy(sql`DATE_TRUNC('${groupBy}', ${mealSchedules.scheduledDate})`);

    // Peak hours analysis
    const peakHours = await db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM ${mealSchedules.createdAt})`,
        mealTime: mealSchedules.mealTime,
        bookingCount: count(),
      })
      .from(mealSchedules)
      .where(
        and(
          startDate ? gte(mealSchedules.scheduledDate, startDate) : undefined,
          endDate ? lte(mealSchedules.scheduledDate, endDate) : undefined
        )
      )
      .groupBy(sql`EXTRACT(HOUR FROM ${mealSchedules.createdAt})`, mealSchedules.mealTime)
      .orderBy(sql`EXTRACT(HOUR FROM ${mealSchedules.createdAt})`);

    return {
      mealTrends,
      peakHours,
    };
  }

  /**
   * Get user dashboard summary
   */
  static async getUserDashboardSummary(userId: string) {
    // Get current balance and recent activity
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { balance: true, role: true },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    // This week's spending
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weeklyStats = await db
      .select({
        totalSpent: sql<number>`CAST(SUM(CASE WHEN ${transactions.type} IN ('meal_schedule', 'meal_redemption') THEN ${transactions.amount} ELSE 0 END) AS INTEGER)`,
        transactionCount: count(),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.createdAt, weekStart)
        )
      );

    // This month's meals
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyMeals = await db
      .select({
        totalScheduled: count(),
        totalRedeemed: sql<number>`COUNT(CASE WHEN ${mealSchedules.status} = 'redeemed' THEN 1 END)`,
        totalWasted: sql<number>`COUNT(CASE WHEN ${mealSchedules.status} IN ('cancelled', 'expired') THEN 1 END)`,
      })
      .from(mealSchedules)
      .where(
        and(
          eq(mealSchedules.userId, userId),
          gte(mealSchedules.scheduledDate, monthStart)
        )
      );

    // Upcoming meals
    const upcomingMeals = await db
      .select({
        id: mealSchedules.id,
        mealTime: mealSchedules.mealTime,
        scheduledDate: mealSchedules.scheduledDate,
        status: mealSchedules.status,
      })
      .from(mealSchedules)
      .where(
        and(
          eq(mealSchedules.userId, userId),
          eq(mealSchedules.status, 'scheduled'),
          gte(mealSchedules.scheduledDate, new Date())
        )
      )
      .orderBy(asc(mealSchedules.scheduledDate))
      .limit(5);

    // Recent transactions
    const recentTransactions = await db
      .select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(10);

    return {
      currentBalance: user.balance,
      userRole: user.role,
      weeklyStats: weeklyStats[0],
      monthlyMeals: monthlyMeals[0],
      upcomingMeals,
      recentTransactions,
    };
  }

  /**
   * Get spending insights and recommendations
   */
  static async getSpendingInsights(input: { userId: string; userRole: number; startDate?: Date; endDate?: Date }) {
    const { userId, userRole, startDate, endDate } = input;

    // Get user's spending pattern
    const spendingPattern = await db
      .select({
        dayOfWeek: sql<number>`EXTRACT(DOW FROM ${transactions.createdAt})`,
        avgSpending: sql<number>`CAST(AVG(${transactions.amount}) AS INTEGER)`,
        transactionCount: count(),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          inArray(transactions.type, ['meal_schedule', 'meal_redemption']),
          startDate ? gte(transactions.createdAt, startDate) : undefined,
          endDate ? lte(transactions.createdAt, endDate) : undefined
        )
      )
      .groupBy(sql`EXTRACT(DOW FROM ${transactions.createdAt})`);

    // Get meal cost for user role
    const mealCost = MealCosts[userRole] || 200;

    // Calculate insights
    const totalSpending = spendingPattern.reduce((sum, day) => sum + (day.avgSpending * day.transactionCount), 0);
    const avgDailySpending = spendingPattern.length > 0 ? totalSpending / 7 : 0;
    const mostExpensiveDay = spendingPattern.reduce((max, day) => 
      (day.avgSpending * day.transactionCount) > (max.avgSpending * max.transactionCount) ? day : max, 
      spendingPattern[0] || { dayOfWeek: 0, avgSpending: 0, transactionCount: 0 }
    );

    const insights = this.generateSpendingInsights(avgDailySpending, mealCost, userRole);

    return {
      spendingPattern,
      avgDailySpending,
      mostExpensiveDay,
      insights,
      recommendations: this.generateRecommendations(avgDailySpending, 0),
    };
  }

  /**
   * Get meal waste analytics
   */
  static async getMealWasteAnalytics(input: TimeRangeInput) {
    const { startDate, endDate } = input;

    const wasteAnalytics = await db
      .select({
        date: sql<string>`DATE(${mealSchedules.scheduledDate})`,
        mealTime: mealSchedules.mealTime,
        totalScheduled: count(),
        totalRedeemed: sql<number>`COUNT(CASE WHEN ${mealSchedules.status} = 'redeemed' THEN 1 END)`,
        totalCancelled: sql<number>`COUNT(CASE WHEN ${mealSchedules.status} = 'cancelled' THEN 1 END)`,
        totalExpired: sql<number>`COUNT(CASE WHEN ${mealSchedules.status} = 'expired' THEN 1 END)`,
        wasteRate: sql<number>`ROUND((COUNT(CASE WHEN ${mealSchedules.status} IN ('cancelled', 'expired') THEN 1 END)::float / COUNT(*)) * 100, 2)`,
      })
      .from(mealSchedules)
      .where(
        and(
          startDate ? gte(mealSchedules.scheduledDate, startDate) : undefined,
          endDate ? lte(mealSchedules.scheduledDate, endDate) : undefined
        )
      )
      .groupBy(sql`DATE(${mealSchedules.scheduledDate})`, mealSchedules.mealTime)
      .orderBy(sql`DATE(${mealSchedules.scheduledDate})`);

    // Calculate total waste metrics
    const totalWasteMetrics = await db
      .select({
        totalScheduled: count(),
        totalWasted: sql<number>`COUNT(CASE WHEN ${mealSchedules.status} IN ('cancelled', 'expired') THEN 1 END)`,
        totalCancelled: sql<number>`COUNT(CASE WHEN ${mealSchedules.status} = 'cancelled' THEN 1 END)`,
        totalExpired: sql<number>`COUNT(CASE WHEN ${mealSchedules.status} = 'expired' THEN 1 END)`,
      })
      .from(mealSchedules)
      .where(
        and(
          startDate ? gte(mealSchedules.scheduledDate, startDate) : undefined,
          endDate ? lte(mealSchedules.scheduledDate, endDate) : undefined
        )
      );

    const metrics = totalWasteMetrics[0];
    const overallWasteRate = metrics.totalScheduled > 0 
      ? (metrics.totalWasted / metrics.totalScheduled) * 100 
      : 0;

    return {
      dailyWaste: wasteAnalytics,
      totalMetrics: {
        ...metrics,
        overallWasteRate,
      },
    };
  }

  /**
   * Generate spending recommendations
   */
  private static generateRecommendations(avgDailySpending: number, currentBalance: number) {
    const recommendations: string[] = [];

    if (avgDailySpending > 0) {
      const daysLeft = Math.floor(currentBalance / avgDailySpending);
      
      if (daysLeft < 7) {
        recommendations.push("Your balance is running low. Consider recharging soon.");
      } else if (daysLeft < 14) {
        recommendations.push("You have about 2 weeks of meals left. Plan your next recharge.");
      }

      if (avgDailySpending > 300) {
        recommendations.push("You're spending above average. Consider meal planning to optimize costs.");
      }
    }

    if (currentBalance > 2000) {
      recommendations.push("You have a healthy balance. Great job managing your meal budget!");
    }

    return recommendations;
  }

  /**
   * Generate spending insights
   */
  private static generateSpendingInsights(avgDailySpending: number, mealCost: number, userRole: number) {
    const insights: string[] = [];

    const avgMealsPerDay = avgDailySpending / mealCost;
    
    if (avgMealsPerDay > 1.5) {
      insights.push("You're having more than one meal per day on average.");
    } else if (avgMealsPerDay < 0.5) {
      insights.push("You're having less than one meal every other day on average.");
    }

    const roleNames = {
      [RoleEnum.student]: "student",
      [RoleEnum.teacher]: "teacher",
      [RoleEnum.normalUser]: "user",
    };

    const roleName = roleNames[userRole as keyof typeof roleNames] || "user";
    insights.push(`As a ${roleName}, your meal cost is ${mealCost} millimes per meal.`);

    return insights;
  }
}