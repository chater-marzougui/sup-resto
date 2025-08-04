import { z } from "zod";

// Base transaction validator
export const baseTransactionValidator = z.object({
  id: z.string().min(1, "Transaction ID is required"),
  userId: z.string().min(1, "User ID is required"),
  type: z.enum(['balance_recharge', 'meal_schedule', 'refund', 'meal_redemption', 'balance_adjustment']),
  amount: z.number().int().min(1, "Amount must be at least 1 millime"),
  processedBy: z.string().min(1, "Processed by ID is required"),
  createdAt: z.date().optional().nullable(),
});

// Create deposit transaction validator
export const createDepositValidator = z.object({
  cin: z.string().min(5, "CIN must be at least 5 characters").max(24, "CIN must not exceed 24 characters"),
  amount: z.number().int().min(100, "Minimum deposit is 100 millimes").max(100000, "Maximum deposit is 100,000 millimes"),
});

// Manual deposit validator (when QR fails)
export const manualDepositValidator = z.object({
  cin: z.string().min(5, "CIN must be at least 5 characters").max(24, "CIN must not exceed 24 characters"),
  amount: z.number().int().min(100, "Minimum deposit is 100 millimes").max(100000, "Maximum deposit is 100,000 millimes"),
  notes: z.string().optional(),
});

// Daily collection summary validator
export const dailyCollectionValidator = z.object({
  date: z.date().optional().default(() => new Date()),
  totalAmount: z.number().int().min(0),
  transactionCount: z.number().int().min(0),
  startTime: z.date(),
  endTime: z.date(),
});

// Student balance lookup validator
export const studentLookupValidator = z.object({
  cin: z.string().min(5, "CIN must be at least 5 characters").max(24, "CIN must not exceed 24 characters"),
});

// Daily report filters validator
export const dailyReportFiltersValidator = z.object({
  date: z.date().optional().default(() => new Date()),
  staffId: z.string().optional(),
  minAmount: z.number().int().min(0).optional(),
  maxAmount: z.number().int().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Quick deposit amounts
export const quickDepositAmounts = [1000, 2000, 5000, 10000, 20000] as const;
export const quickDepositValidator = z.object({
  amount: z.enum(['1000', '2000', '5000', '10000', '20000']).transform(Number),
});

// Offline transaction validator
export const offlineTransactionValidator = z.object({
  id: z.string().min(1),
  cin: z.string().min(5).max(24),
  amount: z.number().int().min(100),
  timestamp: z.date(),
  synced: z.boolean().default(false),
});

// Cash register validator
export const cashRegisterValidator = z.object({
  date: z.date().optional().default(() => new Date()),
  openingBalance: z.number().int().min(0).default(0),
  totalDeposits: z.number().int().min(0),
  expectedCash: z.number().int().min(0),
  actualCash: z.number().int().min(0),
  variance: z.number().int(),
});

// Export types
export type CreateDepositInput = z.infer<typeof createDepositValidator>;
export type ManualDepositInput = z.infer<typeof manualDepositValidator>;
export type DailyCollectionSummary = z.infer<typeof dailyCollectionValidator>;
export type StudentLookupInput = z.infer<typeof studentLookupValidator>;
export type DailyReportFilters = z.infer<typeof dailyReportFiltersValidator>;
export type OfflineTransaction = z.infer<typeof offlineTransactionValidator>;
export type CashRegister = z.infer<typeof cashRegisterValidator>;