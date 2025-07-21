
// src/components/dashboard/today-meals-card.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MealStatusBadge } from '@/components/elements/meal-status-badge';
import { Clock, Plus, X } from 'lucide-react';
import { MealType } from '@/server/db/enums';
import { MealScheduleWithUser } from '@/server/trpc/services/meal-service';
import { canScheduleMeal, canCancelMeal, formatMeals } from '@/lib/utils/main-utils';

interface DayMealsCardProps {
  meals: MealScheduleWithUser[];
  isToday: boolean;
  isLoading?: boolean;
  userId: string;
  onScheduleMeal?: (mealTime: MealType, scheduledDate: Date) => void;
  onCancelMeal?: (mealId: string) => void;
}

const displayWordForSchedule = (status: MealScheduleWithUser['status']): string => {
  switch (status) {
    case 'cancelled':
      return 'Reschedule';
    case 'refunded':
      return 'Reschedule';
    case 'not_created':
      return 'Schedule';
    default:
      return status;
  }
};


export const DayMealsCard: React.FC<DayMealsCardProps> = ({
  meals,
  isToday,
  isLoading = false,
  userId,
  onScheduleMeal,
  onCancelMeal
}) => {

  const title = isToday ? "Today's Meals" : "Tomorrow's Meals";
  const formattedMeals = formatMeals(meals, isToday, userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const scheduleDate = new Date();
  scheduleDate.setDate(scheduleDate.getDate() + (isToday ? 0 : 1));

  return (
    <div className='flex-1'>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formattedMeals.map((meal) => (
              <div key={meal.mealTime} 
                  className="flex justify-between items-center">
                <div>
                  <span className="font-medium capitalize">{meal.mealTime}</span>
                  {meal.status && (
                    <div className="mt-1">
                      <MealStatusBadge status={meal.status} />
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  {canScheduleMeal(meal) && (
                    <Button
                      size="sm"
                      onClick={() => onScheduleMeal?.(meal.mealTime, scheduleDate)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {displayWordForSchedule(meal.status)}
                    </Button>
                  )}
                  {canCancelMeal(meal) && meal.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCancelMeal?.(meal.id!)}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
