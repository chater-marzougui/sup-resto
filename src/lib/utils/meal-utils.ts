import {
  MealType,
  ScheduleStatusType,
} from "@/server/db/enums";
import { MealScheduleWithUser } from "@/server/trpc/services/meal-service";
import { mealTimeEnum } from "@/config/global-config";

export type dayMealData = {
  day: string,
  lunch: MealScheduleWithUser,
  dinner: MealScheduleWithUser
}

export const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const canScheduleMeal = (meal: MealScheduleWithUser): boolean => {
  return mealEligibilityForMeal(meal, ["cancelled", "refunded", "not_created"]);
};

export const canCancelMeal = (meal: MealScheduleWithUser): boolean => {
  return mealEligibilityForMeal(meal, ["scheduled"]);
};

export const isMealExpired = (meal: MealScheduleWithUser): boolean => {
  const now = new Date();
  const adjustedDate = new Date(meal.scheduledDate);
  if (meal.mealTime === "lunch") {
    adjustedDate.setHours(adjustedDate.getHours() + 2);
  } else if (meal.mealTime === "dinner") {
    adjustedDate.setHours(adjustedDate.getHours() + 1);
  }

  return adjustedDate < now;
};

export const shouldExpireMeal = (meal: MealScheduleWithUser): boolean => {
  if(!isMealExpired(meal)) return false;
  return meal.status === "scheduled" || meal.status === "not_created";
};


export const formatMeals = (
  meals: MealScheduleWithUser[], 
  targetDate: Date, 
  userId: string
): [MealScheduleWithUser, MealScheduleWithUser] => {
  let lunch = meals.find((meal) => meal.mealTime === "lunch");
  let dinner = meals.find((meal) => meal.mealTime === "dinner");

  // Create lunch if it doesn't exist
  if (!lunch) {
    const lunchTime = setMealTime(targetDate, 'lunch');
    lunch = createMealSchedule(userId, 'lunch', lunchTime);
  }

  // Create dinner if it doesn't exist
  if (!dinner) {
    const dinnerTime = setMealTime(targetDate, 'dinner');
    dinner = createMealSchedule(userId, 'dinner', dinnerTime);
  }

  if(shouldExpireMeal(lunch)) {
    lunch.status = 'expired';
  }

  if(shouldExpireMeal(dinner)) {
    dinner.status = 'expired';
  }

  return [lunch, dinner];
};

export const formatWeeklyMeals = (
  meals: MealScheduleWithUser[],
): { weeklyMeals: dayMealData[], startOfWeek: Date } => {
  
  // Get start of current week (Monday)
  const startOfWeek = new Date();
  const currentDay = startOfWeek.getDay();
  const mondayOffset = 1 - currentDay; // this works because getDay() returns 0 for Sunday, so +1 makes it Monday
  startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);
  startOfWeek.setHours(0, 0, 0, 0);

  const weeklyMeals: dayMealData[] = [];
  const userId = meals[0]?.userId || "";

  // Process Monday to Saturday (6 days)
  for (let i = 0; i < daysOfWeek.length; i++) {
    const currentDate = new Date(startOfWeek);
    currentDate.setDate(startOfWeek.getDate() + i);

    // Filter meals for this specific day
    const dayMeals = meals.filter((meal) => {
      const mealDate = new Date(meal.scheduledDate);
      return mealDate.getDate() === currentDate.getDate() &&
             mealDate.getMonth() === currentDate.getMonth() &&
             mealDate.getFullYear() === currentDate.getFullYear();
    });

    const [lunch, dinner] = formatMeals(dayMeals, currentDate, userId);

    weeklyMeals.push({
      day: daysOfWeek[i],
      lunch,
      dinner
    });
  }

  return { weeklyMeals, startOfWeek };
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

const createMealSchedule = (
  userId: string,
  mealTime: MealType,
  scheduledDate: Date
): MealScheduleWithUser => {
  const now = new Date();
  return {
    id: '',
    userId,
    mealTime,
    scheduledDate: new Date(scheduledDate), // Create new Date to avoid mutation
    status: 'not_created',
    createdAt: now,
    updatedAt: now,
    statusHistory: []
  };
};

const setMealTime = (date: Date, mealTime: MealType): Date => {
  const newDate = new Date(date);
  const timeIndex = mealTime === 'lunch' ? 0 : 1;
  const [hours, minutes, seconds, milliseconds] = mealTimeEnum[timeIndex];
  newDate.setHours(hours, minutes, seconds, milliseconds);
  return newDate;
};