import { z } from 'zod';

// CIN validation for meal verification
export const mealVerificationValidator = z.object({
  cin: z.string().min(5).max(24, 'CIN must be between 5 and 24 characters'),
  mealTime: z.enum(['lunch', 'dinner']),
  verificationDate: z.date().optional().default(() => new Date()),
});

// Manual meal verification (when QR fails)
export const manualMealVerificationValidator = z.object({
  cin: z.string().min(5).max(24),
  mealTime: z.enum(['lunch', 'dinner']),
  verificationDate: z.date().optional().default(() => new Date()),
  notes: z.string().max(500).optional(),
  forceMark: z.boolean().default(false), // For emergency cases
});

// Student meal status lookup
export const studentMealStatusValidator = z.object({
  cin: z.string().min(5).max(24),
  date: z.date().optional().default(() => new Date()),
});

// Daily verification report filters
export const dailyVerificationFiltersValidator = z.object({
  date: z.date().optional().default(() => new Date()),
  mealTime: z.enum(['lunch', 'dinner']).optional(),
  status: z.enum(['scheduled', 'redeemed', 'expired', 'cancelled']).optional(),
  staffId: z.string().optional(), // Will be set automatically from context
  limit: z.number().int().min(1).max(100).default(25),
  offset: z.number().int().min(0).default(0),
});

// Verification statistics filters
export const verificationStatsValidator = z.object({
  date: z.date().optional().default(() => new Date()),
  mealTime: z.enum(['lunch', 'dinner']).optional(),
});

// Offline verification transaction
export const offlineVerificationValidator = z.object({
  id: z.string(), // Local transaction ID
  cin: z.string().min(5).max(24),
  mealTime: z.enum(['lunch', 'dinner']),
  verificationDate: z.date(),
  timestamp: z.date(),
  notes: z.string().max(500).optional(),
});

// Bulk verification (for multiple students at once)
export const bulkVerificationValidator = z.object({
  verifications: z.array(z.object({
    cin: z.string().min(5).max(24),
    mealTime: z.enum(['lunch', 'dinner']),
  })).min(1).max(50), // Limit bulk operations
  verificationDate: z.date().optional().default(() => new Date()),
});

// Meal period status check
export const mealPeriodValidator = z.object({
  date: z.date().optional().default(() => new Date()),
});

// Export types for use in services
export type MealVerificationInput = z.infer<typeof mealVerificationValidator>;
export type ManualMealVerificationInput = z.infer<typeof manualMealVerificationValidator>;
export type StudentMealStatusInput = z.infer<typeof studentMealStatusValidator>;
export type DailyVerificationFilters = z.infer<typeof dailyVerificationFiltersValidator>;
export type VerificationStatsInput = z.infer<typeof verificationStatsValidator>;
export type OfflineVerificationTransaction = z.infer<typeof offlineVerificationValidator>;
export type BulkVerificationInput = z.infer<typeof bulkVerificationValidator>;
export type MealPeriodInput = z.infer<typeof mealPeriodValidator>;