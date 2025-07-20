
// src/components/dashboard/today-meals-card.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MealStatusBadge } from '@/components/elements/meal-status-badge';
import { Clock, Plus, X } from 'lucide-react';

interface TodayMeal {
  id?: string;
  mealTime: 'lunch' | 'dinner';
  status?: 'scheduled' | 'cancelled' | 'redeemed' | 'expired' | 'refunded';
  canSchedule: boolean;
  canCancel: boolean;
}

interface TodayMealsCardProps {
  meals: TodayMeal[];
  isLoading?: boolean;
  onScheduleMeal?: (mealTime: 'lunch' | 'dinner') => void;
  onCancelMeal?: (mealId: string) => void;
}

export const TodayMealsCard: React.FC<TodayMealsCardProps> = ({
  meals,
  isLoading = false,
  onScheduleMeal,
  onCancelMeal
}) => {
  // TODO: Get today's meal schedules from tRPC
  // const { data: todayMeals } = api.mealSchedules.getTodaySchedule.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Today's Meals</span>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Today's Meals</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {meals.map((meal) => (
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
                {meal.canSchedule && (
                  <Button
                    size="sm"
                    onClick={() => onScheduleMeal?.(meal.mealTime)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Schedule
                  </Button>
                )}
                {meal.canCancel && meal.id && (
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
  );
};
