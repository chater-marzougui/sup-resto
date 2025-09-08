import { z } from "zod";
import { createTRPCRouter, roleProcedure } from "@/server/trpc/trpc";
import { VerificationService } from "@/server/trpc/services/verification-staff-service";
import { TRPCError } from "@trpc/server";
import {
  mealVerificationValidator,
  manualMealVerificationValidator,
  studentMealStatusValidator,
  dailyVerificationFiltersValidator,
  verificationStatsValidator,
  offlineVerificationValidator,
  bulkVerificationValidator,
  mealPeriodValidator,
} from "../validators/verification-staff-validator";
import { RoleEnum } from "@/server/db/enums";

export const verificationRouter = createTRPCRouter({
  /**
   * Verify a meal (mark as consumed)
   */
  verifyMeal: roleProcedure(RoleEnum.verificationStaff)
    .input(mealVerificationValidator)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await VerificationService.verifyMeal(input, ctx.user!.id);
        return {
          success: true,
          message: "Meal verified successfully",
          data: result,
        };
      } catch (error) {
        throw error;
      }
    }),

  /**
   * Manual meal verification (when QR fails or emergency cases)
   */
  manualVerifyMeal: roleProcedure(RoleEnum.verificationStaff)
    .input(manualMealVerificationValidator)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await VerificationService.manualVerifyMeal(input, ctx.user!.id);
        return {
          success: true,
          message: input.forceMark 
            ? "Meal marked manually (emergency override)" 
            : "Meal verified successfully",
          data: result,
          notes: input.notes,
        };
      } catch (error) {
        throw error;
      }
    }),

  /**
   * Check student meal status for specific date
   */
  getStudentMealStatus: roleProcedure(RoleEnum.verificationStaff)
    .input(studentMealStatusValidator)
    .mutation(async ({ input }) => {
      try {
        const status = await VerificationService.getStudentMealStatus(input);
        return status;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get student meal status",
        });
      }
    }),

  /**
   * Get daily verification statistics
   */
  getVerificationStats: roleProcedure(RoleEnum.verificationStaff)
    .input(verificationStatsValidator)
    .query(async ({ input, ctx }) => {
      try {
        const stats = await VerificationService.getVerificationStats(
          input,
          ctx.user!.id
        );
        return stats;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get verification statistics",
        });
      }
    }),

  /**
   * Get detailed verification report
   */
  getVerificationReport: roleProcedure(RoleEnum.verificationStaff)
    .input(dailyVerificationFiltersValidator)
    .query(async ({ input, ctx }) => {
      try {
        input.staffId = ctx.user!.id;
        const report = await VerificationService.getVerificationReport(input);
        return report;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate verification report",
        });
      }
    }),

  /**
   * Check current meal period status
   */
  getMealPeriodStatus: roleProcedure(RoleEnum.verificationStaff)
    .input(mealPeriodValidator)
    .query(async ({ input }) => {
      try {
        const status = await VerificationService.getMealPeriodStatus(input);
        return status;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get meal period status",
        });
      }
    }),

  /**
   * Validate CIN for meal verification
   */
  validateCinForMeal: roleProcedure(RoleEnum.verificationStaff)
    .input(
      z.object({
        cin: z.string().min(5).max(24),
        mealTime: z.enum(['lunch', 'dinner']),
        date: z.date().optional().default(() => new Date()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const status = await VerificationService.getStudentMealStatus({
          cin: input.cin,
          date: input.date,
        });

        const mealStatus = input.mealTime === 'lunch' 
          ? status.lunchStatus 
          : status.dinnerStatus;

        if (mealStatus === 'not_created') {
          return {
            valid: false,
            message: `No ${input.mealTime} scheduled for this date`,
          };
        }

        if (mealStatus === 'redeemed') {
          return {
            valid: false,
            message: `${input.mealTime} already consumed`,
          };
        }

        if (mealStatus === 'cancelled' || mealStatus === 'refunded') {
          return {
            valid: false,
            message: `${input.mealTime} has been ${mealStatus}`,
          };
        }

        if (mealStatus === 'expired') {
          return {
            valid: false,
            message: `${input.mealTime} has expired`,
          };
        }

        return {
          valid: true,
          student: {
            cin: status.student.cin,
            fullName: `${status.student.firstName} ${status.student.lastName}`,
            currentBalance: status.student.balance,
            isActive: status.student.isActive,
          },
          mealStatus,
        };
      } catch (error) {
        if (error instanceof TRPCError && error.code === "NOT_FOUND") {
          return {
            valid: false,
            message: "Student not found with this CIN",
          };
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to validate CIN for meal verification",
        });
      }
    }),

  /**
   * Get recent meal verifications
   */
  getRecentVerifications: roleProcedure(RoleEnum.verificationStaff)
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const stats = await VerificationService.getVerificationStats(
          { date: new Date() },
          ctx.user!.id
        );
        return stats.recentVerifications.slice(0, input.limit);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get recent verifications",
        });
      }
    }),

  /**
   * Process offline verification transactions (sync)
   */
  syncOfflineVerifications: roleProcedure(RoleEnum.verificationStaff)
    .input(
      z.object({
        verifications: z.array(offlineVerificationValidator),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const results = await VerificationService.processOfflineVerifications(
          input.verifications,
          ctx.user!.id
        );

        const successCount = results.filter((r) => r.success).length;
        const failureCount = results.filter((r) => !r.success).length;

        return {
          success: true,
          message: `Synced ${successCount} verifications successfully, ${failureCount} failed`,
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: failureCount,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to sync offline verifications",
        });
      }
    }),

  /**
   * Get no-show students (scheduled but not consumed)
   */
  getNoShowStudents: roleProcedure(RoleEnum.verificationStaff)
    .input(
      z.object({
        date: z.date().optional().default(() => new Date()),
        mealTime: z.enum(['lunch', 'dinner']).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const report = await VerificationService.getVerificationReport({
          date: input.date,
          mealTime: input.mealTime,
          status: 'scheduled',
          limit: 100,
          offset: 0,
        });

        // Filter for meals that should have been consumed based on time
        const now = new Date();
        const isLunchOver = now.getHours() >= 15; // After 3PM
        const isDinnerOver = now.getHours() >= 21 || now.getDate() > input.date.getDate(); // After 9PM or next day

        const noShowMeals = report.schedules.filter(schedule => {
          if (schedule.mealTime === 'lunch' && isLunchOver) return true;
          if (schedule.mealTime === 'dinner' && isDinnerOver) return true;
          return false;
        });

        return {
          noShowStudents: noShowMeals,
          count: noShowMeals.length,
          date: input.date,
          mealTime: input.mealTime,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get no-show students",
        });
      }
    }),
});