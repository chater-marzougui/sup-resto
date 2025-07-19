import { z } from "zod";
import { mealTypeEnum, scheduleStatusEnum } from "@/server/db/enums";

// Meal schedule input validator
export const mealScheduleInputValidator = z.object({
  userId: z.string().min(1, "User ID is required"),
  mealTime: z.enum(mealTypeEnum.enumValues),
  scheduledDate: z.date("Invalid date format"),
});

// Multiple meals scheduling validator
export const scheduleManyMealsValidator = z.object({
  meals: z.array(
    z.object({
      mealDate: z.date("Invalid date format"),
      mealType: z.enum(mealTypeEnum.enumValues),
    })
  ).min(1, "At least one meal must be provided"),
  userId: z.string().min(1, "User ID is required"),
});

// Meal cancellation validator
export const cancelMealValidator = z.object({
  mealId: z.string().min(1, "Meal ID is required"),
  userId: z.string().min(1, "User ID is required"),
});

// Update meal status validator
export const updateMealStatusValidator = z.object({
  mealId: z.string().min(1, "Meal ID is required"),
  status: z.enum(scheduleStatusEnum.enumValues),
});

// Date range validator for meal queries
export const dateRangeValidator = z.object({
  startDate: z.date("Invalid start date format").optional(),
  endDate: z.date("Invalid end date format").optional(),
});

// Meal filters validator
export const mealFiltersValidator = z.object({
  userId: z.string().min(1, "User ID is required"),
  mealTime: z.enum(mealTypeEnum.enumValues).optional(),
  status: z.enum(scheduleStatusEnum.enumValues).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
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