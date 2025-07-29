import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { MealService } from "../services/meal-service";
import {
  mealScheduleInputValidator,
  scheduleManyMealsValidator,
  cancelMealValidator,
  updateMealStatusValidator,
  mealFiltersValidator,
  paginatedMealsValidator,
  dateRangeValidator,
} from "../validators/meal-validator";
import { RoleEnum, scheduleStatusEnum } from "@/server/db/enums";

export const mealRouter = createTRPCRouter({
  /**
   * Schedule a single meal
   */
  scheduleMeal: protectedProcedure
    .input(mealScheduleInputValidator)
    .mutation(async ({ ctx, input }) => {
      try {
        // Use the authenticated user's ID from context
        const mealInput = {
          ...input,
          userId: ctx.user?.id || input.userId,
        };
        
        return await MealService.scheduleMeal(mealInput);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to schedule meal",
          cause: error,
        });
      }
    }),

  /**
   * Schedule multiple meals for a user
   */
  scheduleManyMeals: protectedProcedure
    .input(scheduleManyMealsValidator)
    .mutation(async ({ ctx, input }) => {
      try {
        return await MealService.scheduleManyMeals(input);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to schedule meals",
          cause: error,
        });
      }
    }),

  /**
   * Get current user's meals with optional filters
   */
  getUserMeals: protectedProcedure
    .input(mealFiltersValidator.extend({
      userId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        return await MealService.getUserMeals(input.userId, input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user meals",
          cause: error,
        });
      }
    }),

  /**
   * Get all meals (admin only) with pagination and filters
   */
  getAllMeals: protectedProcedure
    .input(paginatedMealsValidator)
    .query(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user?.role !== 1) {
        // Assuming 1 is admin role
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can view all meals",
        });
      }

      try {
        return await MealService.getAllMeals(input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch all meals",
          cause: error,
        });
      }
    }),

  /**
   * Cancel a meal
   */
  cancelMeal: protectedProcedure
    .input(cancelMealValidator)
    .mutation(async ({ ctx, input }) => {
      try {
        return await MealService.cancelMeal(input);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel meal",
          cause: error,
        });
      }
    }),

  /** 
   * Cancel multiple meals
   */
  cancelManyMeals: protectedProcedure
    .input(scheduleManyMealsValidator)
    .mutation(async ({ ctx, input }) => {
      try {
        return await MealService.cancelManyMeals(input);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel meals",
          cause: error,
        });
      }
    }),

  /**
   * Update meal status (admin only)
   */
  updateMealStatus: protectedProcedure
    .input(updateMealStatusValidator)
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user?.role !== 1) {
        // Assuming 1 is admin role
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can update meal status",
        });
      }

      try {
        return await MealService.updateMealStatus(input);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update meal status",
          cause: error,
        });
      }
    }),

  getDayMeals: protectedProcedure
  .input(z.object({
     userId: z.string().optional(),
     isToday: z.boolean().default(true) 
    }).optional())
  .query(async ({ ctx, input }) => {
    // Check if user is admin or kitchen staff
    if (ctx.user?.role && ctx.user.role < 3) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only administrators and staff can view today's meals",
      });
    }

    if (!ctx.user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to view today's meals",
      });
    }

    let modifiedInput = {
      userId: input?.userId || ctx.user?.id,
      isToday: input?.isToday ?? true,
    };

    try {
      return await MealService.getDayMeals(modifiedInput);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch today's meals",
        cause: error,
      });
    }
  }),

  /**
   * Get this week's meals
   */
  getWeekMeals: protectedProcedure
  .input(z.object({
    userId: z.string().optional(),
  }))
  .query(async ({ ctx, input }) => {
    // Check if user is admin or kitchen staff
    if (ctx.user?.role && ctx.user.role < 3 && !input.userId && input.userId !== ctx.user?.id) {
      // Assuming 1 is admin, 2 is kitchen staff
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only administrators and staff can view weekly meals",
      });
    }

    try {
      return await MealService.getWeekMeals(input);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch weekly meals",
        cause: error,
      });
    }
  }),

  /**
   * Get meal statistics
   */
  getMealStats: protectedProcedure
    .input(z.object({ userId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      try {
        // If userId is provided and user is not admin, they can only view their own stats
        const targetUserId = input?.userId;
        if (
          targetUserId &&
          targetUserId !== ctx.user?.id &&
          ctx.user?.role !== RoleEnum.admin
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only view your own meal statistics",
          });
        }

        // If no userId provided, use current user's ID unless they're admin
        const statsUserId =
          targetUserId ||
          (ctx.user?.role === RoleEnum.admin ? undefined : ctx.user?.id);

        return await MealService.getMealStats(statsUserId);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch meal statistics",
          cause: error,
        });
      }
    }),

  /**
   * Get meals by date range (admin only)
   */
  getMealsByDateRange: protectedProcedure
    .input(
      dateRangeValidator.extend({
        userId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user?.role !== RoleEnum.admin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can view meals by date range",
        });
      }

      try {
        const filters = {
          startDate: input.startDate,
          endDate: input.endDate,
          userId: input.userId ?? "",
        };

        return await MealService.getAllMeals({
          page: 1,
          limit: 1000, // Large limit for date range queries
          sortBy: "scheduledDate",
          sortOrder: "asc",
          ...filters,
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch meals by date range",
          cause: error,
        });
      }
    }),

  /**
   * Get user's upcoming meals
   */
  getUpcomingMeals: protectedProcedure
    .input(
      z.object({ limit: z.number().min(1).max(50).default(10) }).optional()
    )
    .query(async ({ ctx, input }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to view upcoming meals",
          });
        }

        const filters = {
          userId: ctx.user?.id,
          startDate: new Date(),
          status: "scheduled" as const,
        };

        return await MealService.getUserMeals(ctx.user?.id, filters);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch upcoming meals",
          cause: error,
        });
      }
    }),

  /**
   * Get meal history for user
   */
  getMealHistory: protectedProcedure
    .input(
      z
        .object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(50).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      try {
        const { page = 1, limit = 20 } = input || {};

        if (!ctx.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to view upcoming meals",
          });
        }

        const filters = {
          endDate: new Date(),
          userId: ctx.user.id,
        };

        return await MealService.getUserMeals(ctx.user.id, filters);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch meal history",
          cause: error,
        });
      }
    }),

  /**
   * Batch update meal statuses (admin only) - useful for marking meals as served
   */
  batchUpdateMealStatus: protectedProcedure
    .input(
      z.object({
        mealIds: z.array(z.string()).min(1, "At least one meal ID is required"),
        status: z.enum(scheduleStatusEnum.enumValues, "Invalid status"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin

      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view upcoming meals",
        });
      }

      if (ctx.user.role < RoleEnum.paymentStaff) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Only administrators and payment staff can batch update meal statuses",
        });
      }

      try {
        const updatePromises = input.mealIds.map((mealId) =>
          MealService.updateMealStatus({ mealId, status: input.status })
        );

        return await Promise.all(updatePromises);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to batch update meal statuses",
          cause: error,
        });
      }
    }),

  /**
   * Get meal by ID (admin or meal owner)
   */
  getMealById: protectedProcedure
    .input(z.object({ mealId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view upcoming meals",
        });
      }

      try {
        const meal = await MealService.getMealById(input.mealId);

        // Check if user can access this meal
        if (meal.userId !== ctx.user.id && ctx.user.role !== 1) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only view your own meals",
          });
        }

        return meal;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch meal",
          cause: error,
        });
      }
    }),
});
