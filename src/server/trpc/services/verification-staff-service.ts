import { db } from "@/server/db";
import { users, mealSchedules, transactions, syncLogs } from "@/server/db/schema";
import { eq, and, desc, gte, lte, sql, count, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { 
  MealVerificationInput,
  ManualMealVerificationInput,
  StudentMealStatusInput,
  DailyVerificationFilters,
  VerificationStatsInput,
  OfflineVerificationTransaction,
  BulkVerificationInput,
  MealPeriodInput
} from "../validators/verification-staff-validator";
import { TransactionService } from "./transactions-service";

export class VerificationService {
  /**
   * Verify a student's meal (mark as consumed)
   */
  static async verifyMeal(input: MealVerificationInput, verifiedById: string) {
    const startOfDay = new Date(input.verificationDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(input.verificationDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find user by CIN
    const [user] = await db.select().from(users).where(eq(users.cin, input.cin)).limit(1);

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Student not found with this CIN',
      });
    }

    if (!user.isActive) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Student account is inactive',
      });
    }

    // Find the scheduled meal for this date and meal time
    const [mealSchedule] = await db.select()
      .from(mealSchedules)
      .where(and(
        eq(mealSchedules.userId, user.id),
        eq(mealSchedules.mealTime, input.mealTime),
        gte(mealSchedules.scheduledDate, startOfDay),
        lte(mealSchedules.scheduledDate, endOfDay),
        eq(mealSchedules.status, 'scheduled')
      ))
      .limit(1);

    if (!mealSchedule) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `No ${input.mealTime} scheduled for this date`,
      });
    }

    // Check if meal period is currently active
    const now = new Date();
    const isLunchTime = now.getHours() >= 12 && now.getHours() < 15; // 12PM-3PM
    const isDinnerTime = now.getHours() >= 18 && now.getHours() < 21; // 6PM-9PM

    if (input.mealTime === 'lunch' && !isLunchTime) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Lunch verification is only available between 12:00 PM and 3:00 PM',
      });
    }

    if (input.mealTime === 'dinner' && !isDinnerTime) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Dinner verification is only available between 6:00 PM and 9:00 PM',
      });
    }

    // Update meal schedule status to redeemed
    const [updatedSchedule] = await db.update(mealSchedules)
      .set({
        status: 'redeemed',
        statusHistory: sql`${mealSchedules.statusHistory} || ${JSON.stringify([{
          status: 'redeemed',
          timestamp: new Date().toISOString()
        }])}::jsonb`,
        updatedAt: new Date(),
      })
      .where(eq(mealSchedules.id, mealSchedule.id))
      .returning();

    // Create a meal redemption transaction record
    const transaction = await TransactionService.createTransaction({
      userId: user.id,
      type: 'meal_redemption',
      amount: 0, // No money involved in redemption
      processedBy: verifiedById,
    });

    return {
      success: true,
      mealSchedule: updatedSchedule,
      transaction: transaction.transaction,
      studentInfo: {
        cin: user.cin,
        fullName: `${user.firstName} ${user.lastName}`,
        currentBalance: user.balance,
      }
    };
  }

  /**
   * Get student meal status for a specific date
   */
  static async getStudentMealStatus(input: StudentMealStatusInput) {
    const startOfDay = new Date(input.date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(input.date);
    endOfDay.setHours(23, 59, 59, 999);

    const [user] = await db.select({
      id: users.id,
      cin: users.cin,
      firstName: users.firstName,
      lastName: users.lastName,
      balance: users.balance,
      isActive: users.isActive,
    }).from(users).where(eq(users.cin, input.cin)).limit(1);

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Student not found with this CIN',
      });
    }

    // Get all meal schedules for this date
    const mealSchedulesList = await db.select({
      id: mealSchedules.id,
      mealTime: mealSchedules.mealTime,
      status: mealSchedules.status,
      mealCost: mealSchedules.mealCost,
      createdAt: mealSchedules.createdAt,
      updatedAt: mealSchedules.updatedAt,
    }).from(mealSchedules)
      .where(and(
        eq(mealSchedules.userId, user.id),
        gte(mealSchedules.scheduledDate, startOfDay),
        lte(mealSchedules.scheduledDate, endOfDay)
      ));

    return {
      student: user,
      date: input.date,
      mealSchedules: mealSchedulesList,
      hasLunch: mealSchedulesList.some(m => m.mealTime === 'lunch'),
      hasDinner: mealSchedulesList.some(m => m.mealTime === 'dinner'),
      lunchStatus: mealSchedulesList.find(m => m.mealTime === 'lunch')?.status || 'not_created',
      dinnerStatus: mealSchedulesList.find(m => m.mealTime === 'dinner')?.status || 'not_created',
    };
  }

  /**
   * Get daily verification statistics
   */
  static async getVerificationStats(input: VerificationStatsInput, staffId: string) {
    const startOfDay = new Date(input.date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(input.date);
    endOfDay.setHours(23, 59, 59, 999);

    // Base conditions
    let whereConditions = [
      gte(mealSchedules.scheduledDate, startOfDay),
      lte(mealSchedules.scheduledDate, endOfDay),
    ];

    if (input.mealTime) {
      whereConditions.push(eq(mealSchedules.mealTime, input.mealTime));
    }

    // Total scheduled meals
    const [scheduledStats] = await db.select({
      totalScheduled: count(mealSchedules.id),
    }).from(mealSchedules)
      .where(and(...whereConditions, eq(mealSchedules.status, 'scheduled')));

    // Total redeemed meals  
    const [redeemedStats] = await db.select({
      totalRedeemed: count(mealSchedules.id),
    }).from(mealSchedules)
      .where(and(...whereConditions, eq(mealSchedules.status, 'redeemed')));

    // Meals verified by this staff member today
    const [staffVerifications] = await db.select({
      staffVerifications: count(transactions.id),
    }).from(transactions)
      .innerJoin(mealSchedules, eq(transactions.userId, mealSchedules.userId))
      .where(and(
        eq(transactions.processedBy, staffId),
        eq(transactions.type, 'meal_redemption'),
        gte(transactions.createdAt, startOfDay),
        lte(transactions.createdAt, endOfDay)
      ));

    // Recent verifications by staff
    const recentVerifications = await db.select({
      id: transactions.id,
      createdAt: transactions.createdAt,
      studentCin: users.cin,
      studentFirstName: users.firstName,
      studentLastName: users.lastName,
      mealTime: mealSchedules.mealTime,
    }).from(transactions)
      .innerJoin(users, eq(transactions.userId, users.id))
      .innerJoin(mealSchedules, and(
        eq(mealSchedules.userId, users.id),
        eq(mealSchedules.status, 'redeemed')
      ))
      .where(and(
        eq(transactions.processedBy, staffId),
        eq(transactions.type, 'meal_redemption'),
        gte(transactions.createdAt, startOfDay),
        lte(transactions.createdAt, endOfDay)
      ))
      .orderBy(desc(transactions.createdAt))
      .limit(10);

    return {
      date: input.date,
      totalScheduled: scheduledStats.totalScheduled || 0,
      totalRedeemed: redeemedStats.totalRedeemed || 0,
      redemptionRate: scheduledStats.totalScheduled > 0 
        ? Math.round((redeemedStats.totalRedeemed / scheduledStats.totalScheduled) * 100)
        : 0,
      staffVerifications: staffVerifications.staffVerifications || 0,
      noShowCount: (scheduledStats.totalScheduled || 0) - (redeemedStats.totalRedeemed || 0),
      recentVerifications,
    };
  }

  /**
   * Get detailed verification report
   */
  static async getVerificationReport(filters: DailyVerificationFilters) {
    const startOfDay = new Date(filters.date || new Date());
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(filters.date || new Date());
    endOfDay.setHours(23, 59, 59, 999);

    let whereConditions = [
      gte(mealSchedules.scheduledDate, startOfDay),
      lte(mealSchedules.scheduledDate, endOfDay)
    ];

    if (filters.mealTime) {
      whereConditions.push(eq(mealSchedules.mealTime, filters.mealTime));
    }

    if (filters.status) {
      whereConditions.push(eq(mealSchedules.status, filters.status));
    }

    const reportData = await db.query.mealSchedules.findMany({
      where: and(...whereConditions),
      orderBy: desc(mealSchedules.updatedAt),
      limit: filters.limit,
      offset: filters.offset,
      with: {
        user: {
          columns: {
            cin: true,
            firstName: true,
            lastName: true,
            balance: true,
          }
        }
      }
    });

    // Get total count for pagination
    const [{ count: totalCount }] = await db.select({
      count: sql<number>`COUNT(*)`
    }).from(mealSchedules)
      .where(and(...whereConditions));

    return {
      schedules: reportData,
      totalCount: totalCount || 0,
      currentPage: Math.floor(filters.offset / filters.limit) + 1,
      totalPages: Math.ceil((totalCount || 0) / filters.limit),
    };
  }

  /**
   * Check if meal periods are currently active
   */
  static async getMealPeriodStatus(input: MealPeriodInput) {
    const now = new Date();
    const isLunchTime = now.getHours() >= 12 && now.getHours() < 15;
    const isDinnerTime = now.getHours() >= 18 && now.getHours() < 21;

    return {
      currentTime: now,
      isLunchActive: isLunchTime,
      isDinnerActive: isDinnerTime,
      activePeriod: isLunchTime ? 'lunch' : isDinnerTime ? 'dinner' : null,
      nextPeriod: now.getHours() < 12 ? 'lunch' : 
                  now.getHours() < 18 ? 'dinner' : 'lunch', // Next day lunch
      lunchWindow: { start: '12:00', end: '15:00' },
      dinnerWindow: { start: '18:00', end: '21:00' },
    };
  }

  /**
   * Process offline verification transactions
   */
  static async processOfflineVerifications(
    offlineVerifications: OfflineVerificationTransaction[], 
    staffId: string
  ) {
    const results = [];

    for (const offlineVerification of offlineVerifications) {
      try {
        const result = await this.verifyMeal({
          cin: offlineVerification.cin,
          mealTime: offlineVerification.mealTime,
          verificationDate: offlineVerification.verificationDate,
        }, staffId);

        results.push({
          id: offlineVerification.id,
          success: true,
          verification: result,
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
          id: offlineVerification.id,
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
   * Manual meal verification with override options
   */
  static async manualVerifyMeal(input: ManualMealVerificationInput, verifiedById: string) {
    if (!input.forceMark) {
      // Use regular verification process
      return await this.verifyMeal({
        cin: input.cin,
        mealTime: input.mealTime,
        verificationDate: input.verificationDate,
      }, verifiedById);
    }

    // Force mark scenario - for emergency situations
    const [user] = await db.select().from(users).where(eq(users.cin, input.cin)).limit(1);

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Student not found with this CIN',
      });
    }

    // Create emergency transaction log
    const transaction = await TransactionService.createTransaction({
      userId: user.id,
      type: 'meal_redemption',
      amount: 0,
      processedBy: verifiedById,
    });

    return {
      success: true,
      forcedVerification: true,
      transaction: transaction.transaction,
      studentInfo: {
        cin: user.cin,
        fullName: `${user.firstName} ${user.lastName}`,
        currentBalance: user.balance,
      },
      notes: input.notes,
    };
  }
}