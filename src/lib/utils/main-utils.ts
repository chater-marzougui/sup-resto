import {
  RoleEnum,
  ScheduleStatusType,
  TransactionType,
} from "@/server/db/enums";
import { MealScheduleWithUser } from "@/server/trpc/services/meal-service";
import { MealCosts, mealTimeEnum } from "@/config/global-config";

export function getRoleNameByNumber(key: number) {
  const values = Object.values(RoleEnum).filter(
    (value) => typeof value === "string"
  );
  return values[key];
}

export const getRoleColor = (role: number): string => {
  const colors: Record<number, string> = {
    0: "bg-red-100 text-red-800",
    1: "bg-blue-100 text-blue-800",
    2: "bg-green-100 text-green-800",
    3: "bg-purple-100 text-purple-800",
    4: "bg-yellow-100 text-yellow-800",
    5: "bg-gray-100 text-gray-800",
  };
  return colors[role] || "bg-gray-100 text-gray-800";
};

export const getTransactionColor = (type: TransactionType): string => {
  const colors: Record<string, string> = {
    balance_recharge: "text-blue-600",
    meal_schedule: "text-green-600",
    meal_redemption: "text-green-600",
    balance_adjustment: "text-purple-600",
    refund: "text-green-600",
  };
  return colors[type] || "text-gray-600";
};

export const formatCurrency = (amount: number | string): string => {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${(numericAmount / 1000).toFixed(2)} TND`;
};

export const formatDate = (dateString: string | Date): string => {
  if (typeof dateString === "string") {
    dateString = new Date(dateString);
  }
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const canScheduleMeal = (meal: MealScheduleWithUser): boolean => {
  return mealEligibilityForMeal(meal, ["cancelled", "refunded", "not_created"]);
};

export const canCancelMeal = (meal: MealScheduleWithUser): boolean => {
  return mealEligibilityForMeal(meal, ["scheduled"]);
};

export const existingMeals = (meals: MealScheduleWithUser[]): boolean[] => {
  if (meals.length === 0) return [false, false];

  const lunchExists = meals.some((meal) => meal.mealTime === "lunch");
  const dinnerExists = meals.some((meal) => meal.mealTime === "dinner");

  return [lunchExists, dinnerExists];
};

export const formatMeals = (meals: MealScheduleWithUser[], isToday: boolean, userId: string): MealScheduleWithUser[] => {
  const lunchExists = meals.some((meal) => meal.mealTime === "lunch");
  const dinnerExists = meals.some((meal) => meal.mealTime === "dinner");
  const now = new Date();
  if(!isToday) {
    now.setDate(now.getDate() + 1); // Move to tomorrow
  }
  if (!lunchExists) {
    const lunchTime = new Date(now);
    lunchTime.setHours(...mealTimeEnum[0]); // Set
    meals.push({
      id: '',
      userId: userId,
      mealTime: 'lunch',
      scheduledDate: lunchTime,
      status: 'not_created',
      createdAt: now,
      updatedAt: now,
      statusHistory: []
    });
  }
  if (!dinnerExists) {
    const dinnerTime = new Date(now);
    dinnerTime.setHours(...mealTimeEnum[1]); // Set
    meals.push({
      id: '',
      userId: userId,
      mealTime: 'dinner',
      scheduledDate: dinnerTime,
      status: 'not_created',
      createdAt: now,
      updatedAt: now,
      statusHistory: []
    });
  }
  return meals;
};

const mealEligibilityForMeal = (
  meal: MealScheduleWithUser,
  eligibleStatus: ScheduleStatusType[]
): boolean => {

  const now = new Date();
  const adjustedDate = new Date(meal.scheduledDate);
  if (meal.mealTime === "lunch") {
    adjustedDate.setHours(adjustedDate.getHours() + 2);
  } else if (meal.mealTime === "dinner") {
    adjustedDate.setHours(adjustedDate.getHours() + 1);
  }

  const isFutureMeal = adjustedDate > now;
  return eligibleStatus.includes(meal.status) && isFutureMeal;
};