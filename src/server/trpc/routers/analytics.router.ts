import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { AnalyticsService } from "../services/analytics-service";
import {
  userSpendingAnalyticsValidator,
  mealPatternAnalyticsValidator,
  balanceHistoryValidator,
  monthlySpendingValidator,
  comparativeAnalyticsValidator,
  predictiveAnalyticsValidator,
  systemAnalyticsValidator,
  timeRangeValidator,
  topSpendersValidator,
  mealTrendsValidator,
} from "../validators/analytics-validator";
import { RoleEnum } from "@/server/db/enums";

export const analyticsRouter = createTRPCRouter({
  /**
   * Get user's personal spending analytics
   */
  getUserSpendingAnalytics: protectedProcedure
    .input(userSpendingAnalyticsValidator)
    .query(async ({ ctx, input }) => {
      try {
        // Users can only view their own analytics unless they're staff
        if (input.userId !== ctx.user?.id && ctx.user?.role && ctx.user.role > RoleEnum.verificationStaff) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Cannot view other users analytics',
          });
        }

        return await AnalyticsService.getUserSpendingAnalytics({
          ...input,
          userId: input.userId || ctx.user?.id!,
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get user spending analytics',
          cause: error,
        });
      }
    }),

  /**
   * Get user's meal consumption patterns
   */
  getMealPatternAnalytics: protectedProcedure
    .input(mealPatternAnalyticsValidator)
    .query(async ({ ctx, input }) => {
      try {
        // Users can only view their own analytics unless they're staff
        if (input.userId !== ctx.user?.id && ctx.user?.role && ctx.user.role > RoleEnum.verificationStaff) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Cannot view other users meal patterns',
          });
        }

        return await AnalyticsService.getMealPatternAnalytics({
          ...input,
          userId: input.userId || ctx.user?.id!,
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get meal pattern analytics',
          cause: error,
        });
      }
    }),

  /**
   * Get user's balance history
   */
  getBalanceHistory: protectedProcedure
    .input(balanceHistoryValidator)
    .query(async ({ ctx, input }) => {
      try {
        // Users can only view their own balance history unless they're staff
        if (input.userId !== ctx.user?.id && ctx.user?.role && ctx.user.role > RoleEnum.verificationStaff) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Cannot view other users balance history',
          });
        }

        return await AnalyticsService.getBalanceHistory({
          ...input,
          userId: input.userId || ctx.user?.id!,
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get balance history',
          cause: error,
        });
      }
    }),

  /**
   * Get monthly spending breakdown
   */
  getMonthlySpending: protectedProcedure
    .input(monthlySpendingValidator)
    .query(async ({ ctx, input }) => {
      try {
        // Users can only view their own monthly spending unless they're staff
        if (input.userId !== ctx.user?.id && ctx.user?.role && ctx.user.role > RoleEnum.verificationStaff) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Cannot view other users monthly spending',
          });
        }

        return await AnalyticsService.getMonthlySpending({
          ...input,
          userId: input.userId || ctx.user?.id!,
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get monthly spending',
          cause: error,
        });
      }
    }),

  /**
   * Get comparative analytics (compare with similar users)
   */
  getComparativeAnalytics: protectedProcedure
    .input(comparativeAnalyticsValidator)
    .query(async ({ ctx, input }) => {
      try {
        return await AnalyticsService.getComparativeAnalytics({
          ...input,
          userId: ctx.user?.id!,
          compareWithRole: ctx.user?.role!,
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get comparative analytics',
          cause: error,
        });
      }
    }),

  /**
   * Get system-wide analytics (staff only)
   */
  getSystemAnalytics: protectedProcedure
    .input(systemAnalyticsValidator)
    .query(async ({ ctx, input }) => {
      // Check if user is staff
      if (ctx.user?.role && ctx.user.role > RoleEnum.verificationStaff) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only staff members can view system analytics',
        });
      }

      try {
        return await AnalyticsService.getSystemAnalytics(input);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get system analytics',
          cause: error,
        });
      }
    }),

  /**
   * Get top spenders (admin only)
   */
  getTopSpenders: protectedProcedure
    .input(topSpendersValidator)
    .query(async ({ ctx, input }) => {
      // Check if user is admin or payment staff
      if (ctx.user?.role && ctx.user.role > RoleEnum.paymentStaff) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators and payment staff can view top spenders',
        });
      }

      try {
        return await AnalyticsService.getTopSpenders(input);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get top spenders',
          cause: error,
        });
      }
    }),

  /**
   * Get meal trends and patterns (staff only)
   */
  getMealTrends: protectedProcedure
    .input(mealTrendsValidator)
    .query(async ({ ctx, input }) => {
      // Check if user is staff
      if (ctx.user?.role && ctx.user.role > RoleEnum.verificationStaff) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only staff members can view meal trends',
        });
      }

      try {
        return await AnalyticsService.getMealTrends(input);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get meal trends',
          cause: error,
        });
      }
    }),

  /**
   * Get user dashboard summary
   */
  getUserDashboardSummary: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        return await AnalyticsService.getUserDashboardSummary(ctx.user?.id!);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get user dashboard summary',
          cause: error,
        });
      }
    }),

  /**
   * Get spending insights and recommendations
   */
  getSpendingInsights: protectedProcedure
    .input(timeRangeValidator)
    .query(async ({ ctx, input }) => {
      try {
        return await AnalyticsService.getSpendingInsights({
          ...input,
          userId: ctx.user?.id!,
          userRole: ctx.user?.role!,
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get spending insights',
          cause: error,
        });
      }
    }),

  /**
   * Get meal waste analytics (staff only)
   */
  getMealWasteAnalytics: protectedProcedure
    .input(timeRangeValidator)
    .query(async ({ ctx, input }) => {
      // Check if user is staff
      if (ctx.user?.role && ctx.user.role > RoleEnum.verificationStaff) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only staff members can view meal waste analytics',
        });
      }

      try {
        return await AnalyticsService.getMealWasteAnalytics(input);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get meal waste analytics',
          cause: error,
        });
      }
    }),
});