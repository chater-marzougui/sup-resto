import { z } from "zod";
import { mealTypeEnum, scheduleStatusEnum } from "@/server/db/enums";
import { baseUserValidator } from "./user-validator";

export const baseMealScheduleValidator = z.object({
  id: z.string().min(1, "Meal ID is required"),
  userId: baseUserValidator.shape.id,
  mealTime: z.enum(mealTypeEnum.enumValues, "Invalid meal time"),
  scheduledDate: z.date("Invalid date format"),
  status: z.enum(scheduleStatusEnum.enumValues, "Invalid schedule status"),
  mealCost: z.number().int().min(0, "Meal cost must be a non-negative integer"),
  statusHistory: z.array(z.object({
    status: z.enum(scheduleStatusEnum.enumValues, "Invalid status in history"),
    timestamp: z.date("Invalid timestamp format"),
  })).default([]),
  createdAt: z.date("Invalid creation date format").default(() => new Date()),
  updatedAt: z.date("Invalid update date format").default(() => new Date()),
});

// Meal schedule input validator
export const mealScheduleInputValidator = z.object({
  userId: baseUserValidator.shape.id,
  mealTime: baseMealScheduleValidator.shape.mealTime,
  scheduledDate: baseMealScheduleValidator.shape.scheduledDate,
  isTeacherDiscount: z.boolean().default(false),
});

// Multiple meals scheduling validator
export const scheduleManyMealsValidator = z.object({
  meals: z.array(
    z.object({
      mealDate: baseMealScheduleValidator.shape.scheduledDate,
      mealType: baseMealScheduleValidator.shape.mealTime,
    })
  ).min(1, "At least one meal must be provided"),
  userId: baseUserValidator.shape.id,
  isTeacherDiscount: z.boolean().default(false),
});

// Meal cancellation validator
export const cancelMealValidator = z.object({
  mealId: baseMealScheduleValidator.shape.id,
  userId: baseUserValidator.shape.id,
});

// Update meal status validator
export const updateMealStatusValidator = z.object({
  mealId: baseMealScheduleValidator.shape.id,
  status: baseMealScheduleValidator.shape.status,
  mealCost: z.number().int().min(0, "Meal cost must be a non-negative integer").optional(),
});

// Date range validator for meal queries
export const dateRangeValidator = z.object({
  startDate: z.date("Invalid start date format").optional(),
  endDate: z.date("Invalid end date format").optional(),
});

// Meal filters validator
export const mealFiltersValidator = z.object({
  userId: baseUserValidator.shape.id.optional().nullable(),
  mealTime: baseMealScheduleValidator.shape.mealTime.optional(),
  status: baseMealScheduleValidator.shape.status.optional(),
  startDate: baseMealScheduleValidator.shape.scheduledDate.optional(),
  endDate: baseMealScheduleValidator.shape.scheduledDate.optional(),
});

// Pagination validator
export const paginationValidator = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'scheduledDate', 'mealTime']).default('scheduledDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Combined validator for paginated meal queries
export const paginatedMealsValidator = mealFiltersValidator.merge(paginationValidator);

export type MealScheduleInput = z.infer<typeof mealScheduleInputValidator>;
export type ScheduleManyMealsInput = z.infer<typeof scheduleManyMealsValidator>;
export type CancelMealInput = z.infer<typeof cancelMealValidator>;
export type UpdateMealStatusInput = z.infer<typeof updateMealStatusValidator>;
export type DateRangeInput = z.infer<typeof dateRangeValidator>;
export type MealFiltersInput = z.infer<typeof mealFiltersValidator>;
export type PaginationInput = z.infer<typeof paginationValidator>;
export type PaginatedMealsInput = z.infer<typeof paginatedMealsValidator>;