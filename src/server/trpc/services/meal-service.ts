import { db } from "@/server/db";
import { mealSchedules } from "@/server/db/schema";
import { eq, and, or, gte, lte, desc, asc, sql, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  MealScheduleInput,
  ScheduleManyMealsInput,
  UpdateMealStatusInput,
  MealFiltersInput,
  PaginatedMealsInput,
} from "../validators/meal-validator";
import { StatusHistoryEntry } from "@/server/db/schema";
import { MealCosts, maxMealsInRed, mealTimeEnum } from "@/config/global-config";
import {
  transactionTypeEnum,
  ScheduleStatusType,
  MealType,
  RoleEnum,
} from "@/server/db/enums";
import { TransactionService } from "./transactions-service";
import { getDayMonthYear } from "@/lib/utils/main-utils";
import { cancelOrRefundMeal } from "@/lib/utils/meal-utils";
import { UserService } from "./user-service";

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
  static async scheduleMeal(
    input: MealScheduleInput
  ): Promise<MealScheduleWithUser> {
    const { userId, mealTime, scheduledDate, isTeacherDiscount } = input;

    // Check if user exists and has sufficient balance
    const user = await UserService.getById(userId);

    if (!user || !user.isActive) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found or inactive",
      });
    }

    const MEAL_COST = isTeacherDiscount
      ? MealCosts[RoleEnum.student]
      : MealCosts[user.role];
    const MaxMealsInRed = maxMealsInRed[user.role] || 3; // Default max meals if role not found
    if (user.balance < MEAL_COST - MaxMealsInRed * MEAL_COST) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Insufficient balance",
      });
    }

    // Check for duplicate booking
    const [existingMeal] = await db
      .select()
      .from(mealSchedules)
      .where(
        and(
          eq(mealSchedules.userId, userId),
          eq(mealSchedules.scheduledDate, new Date(scheduledDate)),
          eq(mealSchedules.mealTime, mealTime)
        )
      )
      .limit(1);

    if (existingMeal && existingMeal.status === "scheduled") {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Meal already scheduled for this time and date",
      });
    }

    let Meal;

    if (existingMeal && existingMeal.status !== "not_created") {
      this.updateMealStatus({
        mealId: existingMeal.id,
        status: "scheduled",
        mealCost: MEAL_COST,
      });
      Meal = existingMeal;
    } else {
      // Create status history entry
      const statusHistory: StatusHistoryEntry[] = [
        {
          status: "scheduled",
          timestamp: new Date().toISOString(),
        },
      ];

      const scheduledDateTime = new Date(
        new Date(scheduledDate).setHours(
          ...mealTimeEnum[mealTime === "lunch" ? 0 : 1]
        )
      );

      try {
        const [newMeal] = await db
          .insert(mealSchedules)
          .values({
            userId,
            mealTime,
            mealCost: MEAL_COST,
            scheduledDate: scheduledDateTime,
            status: "scheduled",
            statusHistory,
          })
          .returning();

        if (!newMeal) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to schedule meal",
          });
        }

        Meal = newMeal;
      } catch (error) {
        console.error("Error scheduling meal:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to schedule meal, error: " + error,
        });
      }
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
  static async scheduleManyMeals(
    input: ScheduleManyMealsInput
  ): Promise<string[]> {
    const { meals, userId, isTeacherDiscount } = input;

    // Check user existence and balance
    const user = await UserService.getById(userId);

    if (!user || !user.isActive) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found or inactive",
      });
    }

    const MEAL_COST = isTeacherDiscount
      ? MealCosts[RoleEnum.student]
      : MealCosts[user.role];

    const MaxMealsInRed = maxMealsInRed[user.role] || 3;
    const totalCost = meals.length * MEAL_COST;
    const affordableMeals = user.balance + MaxMealsInRed * MEAL_COST;

    if (affordableMeals < totalCost) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Insufficient balance for all meals, you can only afford " +
          Math.floor(affordableMeals / MEAL_COST) +
          " meals.",
      });
    }

    // Check for duplicate bookings

    const existingMeals = await db
      .select()
      .from(mealSchedules)
      .where(
        and(
          eq(mealSchedules.userId, userId),
          or(
            ...meals.map((meal) =>
              and(
                eq(mealSchedules.scheduledDate, new Date(meal.mealDate)),
                eq(mealSchedules.mealTime, meal.mealType)
              )
            )
          )
        )
      );

    if (
      existingMeals.length === meals.length &&
      existingMeals.every((meal) => meal.status === "scheduled")
    ) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "All meals are already scheduled",
      });
    }

    const newMealDates = meals.filter(
      (meal) =>
        !existingMeals.some(
          (existingMeal) =>
            getDayMonthYear(existingMeal.scheduledDate) ===
              getDayMonthYear(meal.mealDate) &&
            existingMeal.mealTime === meal.mealType
        )
    );

    const toUpdateMeals = existingMeals.filter((existingMeal) =>
      meals.some(
        (meal) =>
          getDayMonthYear(existingMeal.scheduledDate) ===
            getDayMonthYear(meal.mealDate) &&
          existingMeal.mealTime === meal.mealType &&
          (existingMeal.status === "cancelled" ||
            existingMeal.status === "refunded")
      )
    );

    const statusHistory: StatusHistoryEntry[] = [
      {
        status: "scheduled",
        timestamp: new Date().toISOString(),
      },
    ];

    const mealUpdates = toUpdateMeals.map((meal) => {
      return {
        id: meal.id,
        userId: meal.userId,
        mealTime: meal.mealTime,
        scheduledDate: meal.scheduledDate,
        status: "scheduled",
        mealCost: MEAL_COST,
        statusHistory: meal.statusHistory
          ? [...meal.statusHistory, ...statusHistory]
          : statusHistory,
        createdAt: meal.createdAt,
        updatedAt: new Date(),
      };
    });

    // Insert all meals
    const mealData = newMealDates.map((meal) => {
      const scheduledDateTime = new Date(
        new Date(meal.mealDate).setHours(
          ...mealTimeEnum[meal.mealType === "lunch" ? 0 : 1]
        )
      );
      return {
        userId,
        mealTime: meal.mealType,
        mealCost: MEAL_COST,
        scheduledDate: scheduledDateTime,
        status: "scheduled" as const,
        statusHistory,
      };
    });

    // Execute all operations
    const results = await Promise.all([
      mealData.length > 0 &&
        db.insert(mealSchedules).values(mealData).returning(),

      mealUpdates.length > 0
        ? Promise.all(
            mealUpdates.map((meal) =>
              db
                .update(mealSchedules)
                .set({
                  status: "scheduled",
                  statusHistory: meal.statusHistory,
                  updatedAt: meal.updatedAt,
                })
                .where(eq(mealSchedules.id, meal.id))
            )
          )
        : Promise.resolve([]),

      TransactionService.createTransaction({
        userId,
        type: transactionTypeEnum.enumValues[1], // Meal schedule
        amount: totalCost,
        processedBy: userId,
      }),
    ]);

    // Extract the new meals from the first result
    const newMeals: string[] = [];
    if (results[0]) {
      newMeals.push(...results[0].map((meal) => meal.id));
    }

    // Return meal IDs
    const mealIds = toUpdateMeals.map((meal) => meal.id);
    return [...mealIds, ...newMeals].flat();
  }

  /**
   * Cancel a meal
   */
  static async cancelMeal(input: {
    mealId: string;
    userId: string;
  }): Promise<MealScheduleWithUser> {
    const { mealId, userId } = input;
    const meal = await db
      .select()
      .from(mealSchedules)
      .where(
        and(eq(mealSchedules.id, mealId), eq(mealSchedules.userId, userId))
      )
      .limit(1);

    if (!meal.length) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Meal not found",
      });
    }

    if (meal[0].status === "cancelled" || meal[0].status === "refunded") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Meal is already cancelled",
      });
    }

    if (meal[0].status === "expired" || meal[0].status === "redeemed") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot cancel a served meal",
      });
    }

    const status = cancelOrRefundMeal(meal[0]);

    await TransactionService.createTransaction({
      userId,
      type: transactionTypeEnum.enumValues[2], // Refund
      amount: status === "refunded" ? meal[0].mealCost : 0,
      processedBy: userId,
    });

    // Update meal status
    await this.updateMealStatus({
      mealId: meal[0].id,
      status: status,
    });

    return await this.getMealById(mealId);
  }

  /**
   * Cancel multiple meals
   */
  static async cancelManyMeals(
    input: ScheduleManyMealsInput
  ): Promise<MealScheduleWithUser[]> {
    const { meals: mealData, userId } = input;

    if (!Array.isArray(mealData) || mealData.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid meal IDs",
      });
    }

    const mealsFromDb = await db
      .select()
      .from(mealSchedules)
      .where(
        and(
          eq(mealSchedules.userId, userId),
          or(
            ...mealData.map((meal) =>
              and(
                eq(mealSchedules.scheduledDate, new Date(meal.mealDate)),
                eq(mealSchedules.mealTime, meal.mealType)
              )
            )
          )
        )
      );

    if (mealsFromDb.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No meals found",
      });
    }

    const meals = mealsFromDb.filter((meal) => meal.status === "scheduled");

    let totalRefundCost = 0;
    for (const meal of meals) {
      if (cancelOrRefundMeal(meal) === "refunded") {
        meals[meals.indexOf(meal)].status = "refunded";
        totalRefundCost += meal.mealCost;
      } else {
        meals[meals.indexOf(meal)].status = "cancelled";
      }
    }

    meals.forEach((meal) => {
      const newHistory: StatusHistoryEntry[] = [
        {
          status: meal.status,
          timestamp: new Date().toISOString(),
        },
      ];
      meal.statusHistory = meal.statusHistory
        ? [...meal.statusHistory, ...newHistory]
        : newHistory;
      meal.updatedAt = new Date();
    });

    await Promise.all([
      TransactionService.createTransaction({
        userId,
        type: transactionTypeEnum.enumValues[2], // Refund
        amount: totalRefundCost,
        processedBy: userId,
      }),

      meals.length > 0
        ? Promise.all(
            meals.map((meal) =>
              db
                .update(mealSchedules)
                .set({
                  status: meal.status,
                  statusHistory: meal.statusHistory,
                  updatedAt: meal.updatedAt,
                })
                .where(eq(mealSchedules.id, meal.id))
            )
          )
        : Promise.resolve([]),
    ]);

    return meals;
  }

  /**
   * Update meal status (for admin use)
   */
  static async updateMealStatus(
    input: UpdateMealStatusInput
  ): Promise<MealScheduleWithUser> {
    const { mealId, status, mealCost } = input;

    const meal = await db
      .select()
      .from(mealSchedules)
      .where(eq(mealSchedules.id, mealId))
      .limit(1);

    if (!meal.length) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Meal not found",
      });
    }

    meal[0].statusHistory?.push({
      status: status,
      timestamp: new Date().toISOString(),
    });

    await db
      .update(mealSchedules)
      .set({
        status,
        statusHistory: meal[0].statusHistory,
        updatedAt: new Date(),
        mealCost: mealCost || meal[0].mealCost,
      })
      .where(eq(mealSchedules.id, mealId));

    return await this.getMealById(mealId);
  }

  /**
   * Get user's meals
   */
  static async getUserMeals(
    userId: string,
    filters?: MealFiltersInput
  ): Promise<MealScheduleWithUser[]> {
    if (!userId || userId.trim() === "") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User ID is required",
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
      conditions.push(
        gte(mealSchedules.scheduledDate, new Date(filters.startDate))
      );
    }

    if (filters?.endDate) {
      conditions.push(
        lte(mealSchedules.scheduledDate, new Date(filters.endDate))
      );
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
  static async getAllMeals(
    input: PaginatedMealsInput
  ): Promise<PaginatedMeals> {
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
      conditions.push(
        gte(mealSchedules.scheduledDate, new Date(filters.startDate))
      );
    }

    if (filters.endDate) {
      conditions.push(
        lte(mealSchedules.scheduledDate, new Date(filters.endDate))
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn =
      sortBy === "scheduledDate"
        ? mealSchedules.scheduledDate
        : sortBy === "mealTime"
        ? mealSchedules.mealTime
        : mealSchedules.createdAt;

    const order = sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn);

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

    const countResult = await db
      .select({
        count: count(),
      })
      .from(mealSchedules)
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
  static async getDayMeals(input: {
    userId: string;
    isToday?: boolean;
  }): Promise<MealScheduleWithUser[]> {
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
  static async getWeekMeals(input: {
    userId?: string | undefined;
  }): Promise<MealScheduleWithUser[]> {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Set to Monday
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
        lte(mealSchedules.scheduledDate, endOfWeek)
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

    let query = db
      .select({
        status: mealSchedules.status,
        count: count(),
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

    stats.forEach((stat) => {
      result.totalScheduled += stat.count;
      switch (stat.status) {
        case "redeemed":
          result.redeemed = stat.count;
          break;
        case "cancelled":
          result.cancelled = stat.count;
          break;
        case "expired":
          result.expired = stat.count;
          break;
        case "refunded":
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
        code: "NOT_FOUND",
        message: "Meal not found",
      });
    }

    return meal;
  }

  private static async getMealsByIds(
    ids: string[]
  ): Promise<MealScheduleWithUser[]> {
    return await db.query.mealSchedules.findMany({
      where: or(...ids.map((id) => eq(mealSchedules.id, id))),
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
