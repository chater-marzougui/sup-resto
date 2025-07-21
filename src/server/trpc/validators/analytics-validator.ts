import { z } from "zod";

// Base time range validator
export const timeRangeValidator = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

// User spending analytics validator
export const userSpendingAnalyticsValidator = z.object({
  userId: z.string().min(1, "User ID is required").optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

// Meal pattern analytics validator
export const mealPatternAnalyticsValidator = z.object({
  userId: z.string().min(1, "User ID is required").optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  mealType: z.enum(['lunch', 'dinner']).optional(),
});

// Balance history validator
export const balanceHistoryValidator = z.object({
  userId: z.string().min(1, "User ID is required").optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().min(1).max(200).default(50),
});

// Monthly spending validator
export const monthlySpendingValidator = z.object({
  userId: z.string().min(1, "User ID is required").optional(),  
  year: z.number().min(2020).max(2030).optional(),
  months: z.array(z.number().min(1).max(12)).optional(),
});

// Comparative analytics validator
export const comparativeAnalyticsValidator = z.object({
  userId: z.string().min(1, "User ID is required"),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  compareWithRole: z.number().min(0).max(5).optional(),
});

// Predictive analytics validator
export const predictiveAnalyticsValidator = z.object({
  predictionDays: z.number().min(1).max(365).default(30),
  includeSeasonality: z.boolean().default(false),
});

// System analytics validator (staff only)
export const systemAnalyticsValidator = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
  includeInactive: z.boolean().default(false),
});

// Top spenders validator (admin/payment staff only)
export const topSpendersValidator = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().min(1).max(100).default(10),
  role: z.number().min(0).max(5).optional(),
});

// Meal trends validator (staff only)
export const mealTrendsValidator = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
  mealType: z.enum(['lunch', 'dinner']).optional(),
});

// Dashboard summary validator
export const dashboardSummaryValidator = z.object({
  includePredictions: z.boolean().default(true),
  includeComparisons: z.boolean().default(true),
});

// Spending insights validator
export const spendingInsightsValidator = z.object({
  analysisType: z.enum(['weekly', 'monthly', 'quarterly']).default('monthly'),
  includeRecommendations: z.boolean().default(true),
});

// Budget tracking validator
export const budgetTrackingValidator = z.object({
  monthlyBudget: z.number().positive("Budget must be positive"),
  alertThreshold: z.number().min(0).max(1).default(0.8), // Alert at 80% of budget
});

// Meal efficiency validator
export const mealEfficiencyValidator = z.object({
  userId: z.string().min(1, "User ID is required").optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  includeComparisons: z.boolean().default(true),
});

// Peak usage analytics validator (staff only)
export const peakUsageAnalyticsValidator = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  granularity: z.enum(['hourly', 'daily', 'weekly']).default('hourly'),
});

// Revenue analytics validator (admin only)
export const revenueAnalyticsValidator = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'quarter']).default('month'),
  includeProjections: z.boolean().default(false),
});

// User behavior analytics validator (staff only)
export const userBehaviorAnalyticsValidator = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  behaviorType: z.enum(['booking_patterns', 'cancellation_trends', 'loyalty_metrics']).optional(),
  segmentByRole: z.boolean().default(true),
});

// Waste reduction analytics validator (staff only)
export const wasteReductionAnalyticsValidator = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  includeRecommendations: z.boolean().default(true),
  groupBy: z.enum(['day', 'week', 'month']).default('week'),
});

// Financial health validator
export const financialHealthValidator = z.object({
  userId: z.string().min(1, "User ID is required").optional(),
  includeProjections: z.boolean().default(true),
  alertsEnabled: z.boolean().default(true),
});

// Custom analytics validator
export const customAnalyticsValidator = z.object({
  metrics: z.array(z.enum([
    'total_spending',
    'meal_count',
    'redemption_rate',
    'cancellation_rate',
    'balance_usage',
    'recharge_frequency'
  ])).min(1, "At least one metric is required"),
  dimensions: z.array(z.enum([
    'time',
    'user_role',
    'meal_type',
    'day_of_week',
    'month'
  ])).optional(),
  filters: z.object({
    userRole: z.number().min(0).max(5).optional(),
    mealType: z.enum(['lunch', 'dinner']).optional(),
    minSpending: z.number().optional(),
    maxSpending: z.number().optional(),
  }).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

// Export types
export type TimeRangeInput = z.infer<typeof timeRangeValidator>;
export type UserSpendingAnalyticsInput = z.infer<typeof userSpendingAnalyticsValidator>;
export type MealPatternAnalyticsInput = z.infer<typeof mealPatternAnalyticsValidator>;
export type BalanceHistoryInput = z.infer<typeof balanceHistoryValidator>;
export type MonthlySpendingInput = z.infer<typeof monthlySpendingValidator>;
export type ComparativeAnalyticsInput = z.infer<typeof comparativeAnalyticsValidator>;
export type PredictiveAnalyticsInput = z.infer<typeof predictiveAnalyticsValidator>;
export type SystemAnalyticsInput = z.infer<typeof systemAnalyticsValidator>;
export type TopSpendersInput = z.infer<typeof topSpendersValidator>;
export type MealTrendsInput = z.infer<typeof mealTrendsValidator>;
export type DashboardSummaryInput = z.infer<typeof dashboardSummaryValidator>;
export type SpendingInsightsInput = z.infer<typeof spendingInsightsValidator>;
export type BudgetTrackingInput = z.infer<typeof budgetTrackingValidator>;
export type MealEfficiencyInput = z.infer<typeof mealEfficiencyValidator>;
export type PeakUsageAnalyticsInput = z.infer<typeof peakUsageAnalyticsValidator>;
export type RevenueAnalyticsInput = z.infer<typeof revenueAnalyticsValidator>;
export type UserBehaviorAnalyticsInput = z.infer<typeof userBehaviorAnalyticsValidator>;
export type WasteReductionAnalyticsInput = z.infer<typeof wasteReductionAnalyticsValidator>;
export type FinancialHealthInput = z.infer<typeof financialHealthValidator>;
export type CustomAnalyticsInput = z.infer<typeof customAnalyticsValidator>;