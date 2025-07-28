import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { TransactionService } from "../services/transactions-service";
import {
  createTransactionValidator,
  bulkScheduleValidator,
  refundTransactionValidator,
  balanceAdjustmentValidator,
  transactionStatsValidator,
  bulkBalanceUpdateValidator,
  transactionIdValidator,
  userTransactionHistoryValidator,
  cursorTransactionsValidator,
  getAllTransactionsValidator,
  transactionWithProcessedByValidator
} from "../validators/transactions-validator";
import { RoleEnum } from "@/server/db/enums";
import { userIdValidator } from "../validators/user-validator";

export const transactionRouter = createTRPCRouter({
  /**
   * Create a new transaction
   */
  createTransaction: protectedProcedure
    .input(createTransactionValidator)
    .mutation(async ({ ctx, input }) => {
      try {
        // For meal redemption, only verification staff can redempt meals
        // For other types, require staff permissions
        if (input.type === 'meal_redemption' && ctx.user?.role && ctx.user?.role >= RoleEnum.verificationStaff) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only verification staff can redeem meals',
          });
        }

        if (input.type === 'balance_adjustment' || input.type === 'balance_recharge') {
          // Only admin and staff can adjust balance or recharge
          if (!ctx.user?.role || ctx.user.role > RoleEnum.verificationStaff) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Only administrators or staff can adjust balances or recharge',
            });
          }
        }

        // Ensure user can only create transactions for themselves unless they're staff
        if (input.userId !== ctx.user?.id && ctx.user?.role && ctx.user.role > RoleEnum.verificationStaff) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Cannot create transactions for other users',
          });
        }

        const transactionInput = {
          ...input,
          processedBy: ctx.user?.id,
        };

        return await TransactionService.createTransaction(transactionInput);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create transaction',
          cause: error,
        });
      }
    }),

  /**
   * Process bulk meal credit Schedule (staff only)
   */
  processBulkSchedule: protectedProcedure
    .input(bulkScheduleValidator)
    .mutation(async ({ ctx, input }) => {
      // Check if user is staff (payment or verification staff, or admin)
      if (ctx.user?.role && ctx.user.role > 2) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only staff members can process bulk meal schedules',
        });
      }

      try {
        const scheduleInput = {
          ...input,
          processedBy: ctx.user?.id || input.processedBy,
        };

        return await TransactionService.processBulkSchedule(scheduleInput);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process bulk schedule',
          cause: error,
        });
      }
    }),

  /**
   * Redeem meal (deduct from balance)
   */
  redeemMeal: protectedProcedure
    .input(userIdValidator)
    .mutation(async ({ ctx, input }) => {

        // Check if user is authenticated
        if (!ctx.user?.id) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'User not authenticated',
            });
        }

      try {
        // Users can redeem their own meals, staff can redeem for others
        if (ctx.user.role > RoleEnum.verificationStaff) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only verification staff or higher can redeem meals',
          });
        }

        return await TransactionService.redeemMeal(input.id);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to redeem meal',
          cause: error,
        });
      }
    }),

  /**
   * Process refund (staff only)
   */
  processRefund: protectedProcedure
    .input(refundTransactionValidator)
    .mutation(async ({ ctx, input }) => {
      // Check if user is staff
      if (ctx.user?.role && ctx.user.role > 2) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only staff members can process refunds',
        });
      }

      try {
        const refundInput = {
          ...input,
          processedBy: ctx.user?.id || input.processedBy,
        };

        return await TransactionService.processRefund(refundInput);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process refund',
          cause: error,
        });
      }
    }),

  /**
   * Adjust user balance (admin only)
   */
  adjustBalance: protectedProcedure
    .input(balanceAdjustmentValidator)
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user?.role !== 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can adjust balances',
        });
      }

      try {
        const adjustmentInput = {
          ...input,
          processedBy: ctx.user?.id || input.processedBy,
        };

        return await TransactionService.adjustBalance(adjustmentInput);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to adjust balance',
          cause: error,
        });
      }
    }),


  /**
   * Get user transaction history
   */
  getUserTransactionHistory: protectedProcedure
    .input(userTransactionHistoryValidator)
    .output(z.array(transactionWithProcessedByValidator))
    .query(async ({ ctx, input }) => {
      try {
        // Users can view their own history, staff can view any history
        if (input.userId !== ctx.user?.id && ctx.user?.role && ctx.user.role > 2) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Cannot access other users\' transaction history',
          });
        }
        return await TransactionService.getUserTransactionHistory(input);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch transaction history',
          cause: error,
        });
      }
    }),

  /**
   * Get all transactions with filters and pagination (staff only)
   */
  getAllTransactions: protectedProcedure
    .input(cursorTransactionsValidator)
    .output(getAllTransactionsValidator)
    .query(async ({ ctx, input }) => {
      // Check if user is staff
      if (ctx.user?.role && ctx.user.role > 2 && ctx.user.id !== input.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only staff members can view all transactions',
        });
      }
      console.log("Fetching all transactions with filters:", input);

      try {
        return await TransactionService.getAllTransactions(input);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch transactions',
          cause: error,
        });
      }
    }),

  /**
   * Get transaction statistics (admin only)
   */
  getTransactionStats: protectedProcedure
    .input(transactionStatsValidator)
    .query(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user?.role !== 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can view transaction statistics',
        });
      }

      try {
        return await TransactionService.getTransactionStats(input);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch transaction statistics',
          cause: error,
        });
      }
    }),

  /**
   * Process bulk balance updates (admin only)
   */
  processBulkBalanceUpdate: protectedProcedure
    .input(bulkBalanceUpdateValidator)
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user?.role !== 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can perform bulk balance updates',
        });
      }

      try {
        const updateInput = {
          ...input,
          processedBy: ctx.user?.id || input.processedBy,
        };

        return await TransactionService.processBulkBalanceUpdate(updateInput);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process bulk balance update',
          cause: error,
        });
      }
    }),

  /**
   * Get transaction by ID (staff only)
   */
  getTransactionById: protectedProcedure
    .input(transactionIdValidator)
    .query(async ({ ctx, input }) => {
      // Check if user is staff
      if (ctx.user?.role && ctx.user.role > 2) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only staff members can view transaction details',
        });
      }

      try {
        return await TransactionService.getTransactionById(input.transactionId);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch transaction details',
          cause: error,
        });
      }
    }),

  /**
   * Get low balance users (admin only)
   */
  getLowBalanceUsers: protectedProcedure
    .input(z.object({
      threshold: z.number().min(0).default(5),
    }))
    .query(async ({ ctx, input }) => {
      // Check if user is admin or staff
      if (ctx.user?.role && ctx.user.role > 2) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only staff members can view low balance users',
        });
      }

      try {
        return await TransactionService.getLowBalanceUsers(input.threshold);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch low balance users',
          cause: error,
        });
      }
    }),

  /**
   * Get daily transaction summary for today (staff only)
   */
  getTodayTransactionSummary: protectedProcedure
    .query(async ({ ctx }) => {
      // Check if user is staff
      if (ctx.user?.role && ctx.user.role > 2) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only staff members can view transaction summaries',
        });
      }

      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return await TransactionService.getTransactionStats({
          startDate: today,
          endDate: tomorrow,
          groupBy: 'day',
        });
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch today\'s transaction summary',
          cause: error,
        });
      }
    }),
});