import { z } from 'zod';
import { createTRPCRouter, roleProcedure } from '@/server/trpc/trpc';
import { PaymentService } from '@/server/trpc/services/payment-staff-service';
import { TRPCError } from '@trpc/server';
import {
  createDepositValidator,
  manualDepositValidator,
  studentLookupValidator,
  dailyReportFiltersValidator,
  offlineTransactionValidator,
  quickDepositValidator,
} from '../validators/payment-staff-validator';
import { RoleEnum } from '@/server/db/enums';

export const paymentRouter = createTRPCRouter({
  /**
   * Create a deposit transaction
   */
  createDeposit: roleProcedure(RoleEnum.paymentStaff)
    .input(createDepositValidator)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await PaymentService.createDeposit(input, ctx.user!.id);
        return {
          success: true,
          message: 'Deposit created successfully',
          data: result,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create deposit',
        });
      }
    }),

  /**
   * Manual deposit (when QR fails)
   */
  manualDeposit: roleProcedure(RoleEnum.paymentStaff)
    .input(manualDepositValidator)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await PaymentService.createDeposit({
          cin: input.cin,
          amount: input.amount,
        }, ctx.user!.id);
        
        return {
          success: true,
          message: 'Manual deposit created successfully',
          data: result,
          notes: input.notes,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create manual deposit',
        });
      }
    }),


  /**
   * Lookup student by CIN
   */
  lookupStudent: roleProcedure(RoleEnum.paymentStaff)
    .input(studentLookupValidator)
    .mutation(async ({ input }) => {
      try {
        const student = await PaymentService.getStudentByCin(input);
        return student;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to lookup student',
        });
      }
    }),

  /**
   * Get daily collection summary
   */
  getDailyCollection: roleProcedure(RoleEnum.paymentStaff)
    .input(z.object({
      date: z.date().optional().default(() => new Date()),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const summary = await PaymentService.getDailyCollectionSummary(
          input.date,
          ctx.user!.id
        );
        return summary;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get daily collection summary',
        });
      }
    }),

  /**
   * Get recent transactions
   */
  getRecentTransactions: roleProcedure(RoleEnum.paymentStaff)
    .input(z.object({
      limit: z.number().int().min(1).max(50).default(10),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const transactions = await PaymentService.getRecentTransactions(
          ctx.user!.id,
          input.limit
        );
        return transactions;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get recent transactions',
        });
      }
    }),

  /**
   * Get daily report with filters
   */
  getDailyReport: roleProcedure(RoleEnum.paymentStaff)
    .input(dailyReportFiltersValidator)
    .query(async ({ input, ctx }) => {
      try {
        input.staffId = ctx.user!.id;
        const report = await PaymentService.getDailyReport(input);
        return report;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate daily report',
        });
      }
    }),

  /**
   * Process offline transactions (sync)
   */
  syncOfflineTransactions: roleProcedure(RoleEnum.paymentStaff)
    .input(z.object({
      transactions: z.array(offlineTransactionValidator),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const results = await PaymentService.processOfflineTransactions(
          input.transactions,
          ctx.user!.id
        );
        
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;
        
        return {
          success: true,
          message: `Synced ${successCount} transactions successfully, ${failureCount} failed`,
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: failureCount,
          }
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sync offline transactions',
        });
      }
    }),

  /**
   * Get cash register summary
   */
  getCashRegisterSummary: roleProcedure(RoleEnum.paymentStaff)
    .input(z.object({
      date: z.date().optional().default(() => new Date()),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const summary = await PaymentService.getCashRegisterSummary(
          input.date,
          ctx.user!.id
        );
        return summary;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get cash register summary',
        });
      }
    }),

  /**
   * Validate CIN before deposit (for QR scanner)
   */
  validateCin: roleProcedure(RoleEnum.paymentStaff)
    .input(z.object({
      cin: z.string().min(5).max(24),
    }))
    .mutation(async ({ input }) => {
      try {
        const student = await PaymentService.getStudentByCin(input);
        return {
          valid: true,
          student: {
            cin: student.cin,
            fullName: `${student.firstName} ${student.lastName}`,
            currentBalance: student.balance,
            isActive: student.isActive,
          }
        };
      } catch (error) {
        if (error instanceof TRPCError && error.code === 'NOT_FOUND') {
          return {
            valid: false,
            message: 'Student not found with this CIN',
          };
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to validate CIN',
        });
      }
    }),
});