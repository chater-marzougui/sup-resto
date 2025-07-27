import { db } from "@/server/db";
import { mealSchedules, users, transactions } from "@/server/db/schema";
import { eq, and, or, gte, lte, desc, asc, sql, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { 
  MealScheduleInput, 
  ScheduleManyMealsInput, 
  UpdateMealStatusInput,
  MealFiltersInput,
  PaginatedMealsInput 
} from "../validators/meal-validator";
import { StatusHistoryEntry } from "@/server/db/schema";
import { MealCosts, maxMealsInRed, mealTimeEnum } from "@/config/global-config";
import { transactionTypeEnum, ScheduleStatusType, MealType } from "@/server/db/enums";
import {TransactionService} from "./transactions-service";

// Types
export type MealScheduleWithUser = {
  id: string;
  userId: string;
  mealTime: MealType;
  scheduledDate: Date;
  status: ScheduleStatusType;
  statusHistory: StatusHistoryEntry[] | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    cin: string;
    firstName: string;
    lastName: string;
    email: string | null;
  };
};

export type PaginatedMeals = {
  meals: MealScheduleWithUser[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type MealStats = {
  totalScheduled: number;
  redeemed: number;
  cancelled: number;
  expired: number;
  refunded: number;
};

export class MealService {
  /**
   * Schedule a single meal
   */
  static async scheduleMeal(input: MealScheduleInput): Promise<MealScheduleWithUser> {
    const { userId, mealTime, scheduledDate } = input;
    
    // Check if user exists and has sufficient balance
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || !user.isActive) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found or inactive',
      });
    }

    const MEAL_COST = MealCosts[user.role] || 200; // Default cost if role not found
    const MaxMealsInRed = maxMealsInRed[user.role] || 3; // Default max meals if role not found
    if (user.balance < MEAL_COST - MaxMealsInRed * MEAL_COST) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Insufficient balance',
      });
    }
    
    // Check for duplicate booking
    const [existingMeal] = await db.select()
      .from(mealSchedules)
      .where(and(
        eq(mealSchedules.userId, userId),
        eq(mealSchedules.scheduledDate, new Date(scheduledDate)),
        eq(mealSchedules.mealTime, mealTime)
      ))
      .limit(1);
    
    if (existingMeal && existingMeal.status === 'scheduled') {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Meal already scheduled for this time and date',
      });
    }

    let Meal;

    if (existingMeal && existingMeal.status !== 'not_created') {
      this.updateMealStatus({
        mealId: existingMeal.id,
        status: 'scheduled',
      });
      Meal =  existingMeal;
    } else {
      // Create status history entry
      const statusHistory: StatusHistoryEntry[] = [{
        status: 'scheduled',
        timestamp: new Date().toISOString(),
      }];

      const scheduledDateTime = 
              new Date(new Date(scheduledDate)
              .setHours(...mealTimeEnum[mealTime === 'lunch' ? 0 : 1]));

      // Schedule the meal
      const newMeal = await db.insert(mealSchedules).values({
        userId,
        mealTime,
        scheduledDate: scheduledDateTime,
        status: 'scheduled',
        statusHistory,
      }).returning();
      
      if (!newMeal.length) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to schedule meal',
        });
      }

      Meal = newMeal[0];
    }
    
    // Record transaction
    await TransactionService.createTransaction({
      userId,
      type: transactionTypeEnum.enumValues[1], // Meal schedule
      amount: MEAL_COST,
      processedBy: userId,
    });
    
    // Return meal with user info
    return Meal;
  }

  /**
   * Schedule multiple meals
   */
  static async scheduleManyMeals(input: ScheduleManyMealsInput): Promise<MealScheduleWithUser[]> {
    const { meals, userId } = input;
    
    // Check user existence and balance
    const user = await db.select({
      id: users.id,
      balance: users.balance,
      isActive: users.isActive,
      role: users.role,
    }).from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user.length || !user[0].isActive) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found or inactive',
      });
    }
    const MEAL_COST = MealCosts[user[0].role] || 200; // Default cost if role not found
    const MaxMealsInRed = maxMealsInRed[user[0].role] || 3;
    const totalCost = meals.length * MEAL_COST;

    if (user[0].balance < totalCost - MaxMealsInRed * MEAL_COST) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Insufficient balance for all meals',
      });
    }
    
    // Check for duplicate bookings
    const existingMeals = await db.select()
      .from(mealSchedules)
      .where(and(
        eq(mealSchedules.userId, userId),
        or(...meals.map(meal => 
          and(
            eq(mealSchedules.scheduledDate, new Date(meal.mealDate)),
            eq(mealSchedules.mealTime, meal.mealType)
          )
        ))
      ));
    
    if (existingMeals.length > 0) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Some meals are already scheduled',
      });
    }
    
    const statusHistory: StatusHistoryEntry[] = [{
      status: 'scheduled',
      timestamp: new Date().toISOString(),
    }];
    
    // Insert all meals
    const mealData = meals.map(meal => {
      const scheduledDateTime = new Date(new Date(meal.mealDate)
      .setHours(...mealTimeEnum[meal.mealType === 'lunch' ? 0 : 1]));
      return {
        userId,
        mealTime: meal.mealType,
        scheduledDate: scheduledDateTime,
        status: 'scheduled' as const,
        statusHistory,
      };
    });

    const newMeals = await db.insert(mealSchedules).values(mealData).returning();
    
    // Update balance and create transaction
    await Promise.all([
      db.update(users)
        .set({ balance: sql`${users.balance} - ${totalCost}` })
        .where(eq(users.id, userId)),
      
      db.insert(transactions).values({
        userId,
        type: transactionTypeEnum.enumValues[1],
        amount: totalCost,
        processedBy: userId,
      })
    ]);
    
    // Return meals with user info
    const mealIds = newMeals.map(meal => meal.id);
    return await this.getMealsByIds(mealIds);
  }
  
  /**
   * Cancel a meal
   */
  static async cancelMeal(mealId: string, userId: string): Promise<MealScheduleWithUser> {
    const meal = await db.select()
      .from(mealSchedules)
      .where(and(
        eq(mealSchedules.id, mealId),
        eq(mealSchedules.userId, userId)
      ))
      .limit(1);
    
    if (!meal.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Meal not found',
      });
    }
    
    if (meal[0].status === 'cancelled') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Meal is already cancelled',
      });
    }
    
    if (meal[0].status === 'expired' || meal[0].status === 'redeemed') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot cancel a served meal',
      });
    }

    let status: 'cancelled' | 'refunded' = 'cancelled';
    const userRole = await db.select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
    const MEAL_COST = MealCosts[userRole[0].role] || 200;

    if (meal[0].scheduledDate > new Date(new Date().getTime() - 3 * 60 * 60 * 1000)) {
      status = 'refunded';
      await TransactionService.createTransaction({
        userId,
        type: transactionTypeEnum.enumValues[2], // Refund
        amount: MEAL_COST,
        processedBy: userId,
      });
    }

    // Update status history
    meal[0].statusHistory?.push({
      status: status,
      timestamp: new Date().toISOString(),
    });

    // Update meal status
    await this.updateMealStatus({
      mealId: meal[0].id,
      status: status,
    });
    
    return await this.getMealById(mealId);
  }
  
  /**
   * Update meal status (for admin use)
   */
  static async updateMealStatus(input: UpdateMealStatusInput): Promise<MealScheduleWithUser> {
    const { mealId, status } = input;
    
    const meal = await db.select()
      .from(mealSchedules)
      .where(eq(mealSchedules.id, mealId))
      .limit(1);
    
    if (!meal.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Meal not found',
      });
    }
    
    meal[0].statusHistory?.push(
        {
            status: status,
            timestamp: new Date().toISOString(),
        }
    );
    
    await db.update(mealSchedules)
      .set({ 
        status,
        statusHistory: meal[0].statusHistory,
        updatedAt: new Date()
      })
      .where(eq(mealSchedules.id, mealId));
    
    return await this.getMealById(mealId);
  }
  
  /**
   * Get user's meals
   */
  static async getUserMeals(userId: string, filters?: MealFiltersInput): Promise<MealScheduleWithUser[]> {
  if (!userId || userId.trim() === "") {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'User ID is required',
    });
  }

  const conditions = [eq(mealSchedules.userId, userId)];

  if (filters?.mealTime) {
    conditions.push(eq(mealSchedules.mealTime, filters.mealTime));
  }

  if (filters?.status) {
    conditions.push(eq(mealSchedules.status, filters.status));
  }

  if (filters?.startDate) {
    conditions.push(gte(mealSchedules.scheduledDate, new Date(filters.startDate)));
  }

  if (filters?.endDate) {
    conditions.push(lte(mealSchedules.scheduledDate, new Date(filters.endDate)));
  }

  return await db.query.mealSchedules.findMany({
    where: and(...conditions),
    with: {
      user: {
        columns: {
          id: true,
          cin: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: desc(mealSchedules.scheduledDate),
  });
}
  
  /**
   * Get all meals with pagination
   */
  static async getAllMeals(input: PaginatedMealsInput): Promise<PaginatedMeals> {
  const { page, limit, sortBy, sortOrder, ...filters } = input;
  const offset = (page - 1) * limit;

  // Build filter conditions
  const conditions = [];

  if (filters.userId && filters.userId.trim() !== "") {
    conditions.push(eq(mealSchedules.userId, filters.userId));
  }

  if (filters.mealTime) {
    conditions.push(eq(mealSchedules.mealTime, filters.mealTime));
  }

  if (filters.status) {
    conditions.push(eq(mealSchedules.status, filters.status));
  }

  if (filters.startDate) {
    conditions.push(gte(mealSchedules.scheduledDate, new Date(filters.startDate)));
  }

  if (filters.endDate) {
    conditions.push(lte(mealSchedules.scheduledDate, new Date(filters.endDate)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn =
    sortBy === 'scheduledDate' ? mealSchedules.scheduledDate :
    sortBy === 'mealTime' ? mealSchedules.mealTime :
    mealSchedules.createdAt;

  const order = sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn);

  const meals = await db.query.mealSchedules.findMany({
    where: whereClause,
    with: {
      user: {
        columns: {
          id: true,
          cin: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: order,
    limit,
    offset,
  });

  // Total count query
  const countResult = await db.select({ count: count() })
    .from(mealSchedules)
    .innerJoin(users, eq(mealSchedules.userId, users.id))
    .where(whereClause);

  const totalCount = Number(countResult[0]?.count ?? 0);
  const totalPages = Math.ceil(totalCount / limit);

  return {
    meals,
    totalCount,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
  
  /**
   * Get day's meals
   */
  static async getDayMeals(input: { userId: string, isToday?: boolean }): Promise<MealScheduleWithUser[]> {
    const today = new Date();
    if (input.isToday !== undefined && !input.isToday) {
      today.setDate(today.getDate() + 1); // Move to tomorrow
    }
    today.setHours(1, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return await db.query.mealSchedules.findMany({
      where: and(
        eq(mealSchedules.userId, input.userId),
        gte(mealSchedules.scheduledDate, today),
        lte(mealSchedules.scheduledDate, tomorrow)
      ),
      with: {
        user: {
          columns: {
            id: true,
            cin: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: asc(mealSchedules.mealTime),
    });
  }
  
  /**
   * Get week's meals
   */
  static async getWeekMeals(input: { userId?: string | undefined }): Promise<MealScheduleWithUser[]> {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Set to Monday
    console.log("Start of week:", startOfWeek);
    startOfWeek.setHours(1, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 5); // Set to Saturday
    endOfWeek.setHours(23, 0, 0, 0);

    const whereClause = [];
    if (input.userId && input.userId.trim() !== "") {
      whereClause.push(eq(mealSchedules.userId, input.userId));
    }

    return await db.query.mealSchedules.findMany({
      where: and(
        ...whereClause,
        gte(mealSchedules.scheduledDate, startOfWeek),
        lte(mealSchedules.scheduledDate, endOfWeek),
      ),
      orderBy: [asc(mealSchedules.scheduledDate), asc(mealSchedules.mealTime)],
    });
  }
  
  /**
   * Get meal statistics
   */
  static async getMealStats(userId?: string): Promise<MealStats> {
    let conditions = undefined;
    if (userId && userId.trim() !== "") {
        conditions = eq(mealSchedules.userId, userId);
    }

    let query = db.select({
      status: mealSchedules.status,
      count: count()
    })
    .from(mealSchedules)
    .where(conditions)
    .groupBy(mealSchedules.status);

    const stats = await query;
    
    const result: MealStats = {
      totalScheduled: 0,
      redeemed: 0,
      cancelled: 0,
      expired: 0,
      refunded: 0,
    };
    
    stats.forEach(stat => {
      result.totalScheduled += stat.count;
      switch (stat.status) {
        case 'redeemed':
          result.redeemed = stat.count;
          break;
        case 'cancelled':
          result.cancelled = stat.count;
          break;
        case 'expired':
          result.expired = stat.count;
          break;
        case 'refunded':
          result.refunded = stat.count;
          break;
        default:
          break;
      }
    });
    
    return result;
  }
  
  /**
   * Get meal by ID
   */
  static async getMealById(id: string): Promise<MealScheduleWithUser> {
    const meal = await db.query.mealSchedules.findFirst({
      where: eq(mealSchedules.id, id),
      with: {
        user: {
          columns: {
            id: true,
            cin: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!meal) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Meal not found',
      });
    }

    return meal;
  }
  
  private static async getMealsByIds(ids: string[]): Promise<MealScheduleWithUser[]> {
    return await db.query.mealSchedules.findMany({
      where: or(...ids.map(id => eq(mealSchedules.id, id))),
      with: {
        user: {
          columns: {
            id: true,
            cin: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }
}