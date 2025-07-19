import { z } from "zod";
import { transactionTypeEnum } from "@/server/db/enums";

// Create transaction validator
export const createTransactionValidator = z.object({
  userId: z.string().min(1, "User ID is required"),
  type: z.enum(transactionTypeEnum.enumValues),
  amount: z.number().positive("Amount must be positive"),
  processedBy: z.string().min(1, "Processor ID is required").optional(),
});

// Bulk purchase validator for meal credits
export const bulkPurchaseValidator = z.object({
  userId: z.string().min(1, "User ID is required"),
  amount: z.number().positive("Amount must be positive"),
  processedBy: z.string().min(1, "Processor ID is required"),
});

// Refund transaction validator
export const refundTransactionValidator = z.object({
  userId: z.string().min(1, "User ID is required"),
  scheduledMealId: z.string().min(1, "Meal ID is required"),
  amount: z.number().positive("Refund amount must be positive"),
  reason: z.string().min(1, "Refund reason is required").optional(),
  processedBy: z.string().min(1, "Processor ID is required"),
});

// Balance adjustment validator (admin only)
export const balanceAdjustmentValidator = z.object({
  userId: z.string().min(1, "User ID is required"),
  amount: z.number("Amount is required"), // Can be positive or negative
  reason: z.string().min(1, "Adjustment reason is required"),
  processedBy: z.string().min(1, "Processor ID is required"),
});

// Transaction filters validator
export const transactionFiltersValidator = z.object({
  userId: z.string().optional(),
  type: z.enum(transactionTypeEnum.enumValues).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  processedBy: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
});

// Pagination validator for transactions
export const transactionPaginationValidator = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'amount', 'type']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Combined validator for paginated transaction queries
export const paginatedTransactionsValidator = transactionFiltersValidator.merge(transactionPaginationValidator);

// User balance query validator
export const userBalanceValidator = z.object({
  userId: z.string().min(1, "User ID is required"),
});

// Transaction statistics validator
export const transactionStatsValidator = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

// Bulk balance update validator (admin only)
export const bulkBalanceUpdateValidator = z.object({
  updates: z.array(
    z.object({
      userId: z.string().min(1, "User ID is required"),
      amount: z.number("Amount is required"),
      reason: z.string().min(1, "Reason is required"),
    })
  ).min(1, "At least one balance update is required"),
  processedBy: z.string().min(1, "Processor ID is required"),
});

// Transaction ID validator
export const transactionIdValidator = z.object({
  transactionId: z.string().min(1, "Transaction ID is required"),
});

// User transaction history validator
export const userTransactionHistoryValidator = z.object({
  userId: z.string().min(1, "User ID is required"),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  type: z.enum(transactionTypeEnum.enumValues).optional(),
});

// Export types
export type CreateTransactionInput = z.infer<typeof createTransactionValidator>;
export type BulkPurchaseInput = z.infer<typeof bulkPurchaseValidator>;
export type RefundTransactionInput = z.infer<typeof refundTransactionValidator>;
export type BalanceAdjustmentInput = z.infer<typeof balanceAdjustmentValidator>;
export type TransactionFiltersInput = z.infer<typeof transactionFiltersValidator>;
export type TransactionPaginationInput = z.infer<typeof transactionPaginationValidator>;
export type PaginatedTransactionsInput = z.infer<typeof paginatedTransactionsValidator>;
export type UserBalanceInput = z.infer<typeof userBalanceValidator>;
export type TransactionStatsInput = z.infer<typeof transactionStatsValidator>;
export type BulkBalanceUpdateInput = z.infer<typeof bulkBalanceUpdateValidator>;
export type TransactionIdInput = z.infer<typeof transactionIdValidator>;
export type UserTransactionHistoryInput = z.infer<typeof userTransactionHistoryValidator>;