
// src/components/dashboard/weekly-meal-calendar.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MealStatusBadge } from '@/components/elements/meal-status-badge';
import { trpc } from '@/lib/trpc';

interface MealSchedule {
  id: string;
  date: string;
  mealTime: 'lunch' | 'dinner';
  status: 'scheduled' | 'cancelled' | 'redeemed' | 'expired' | 'refunded';
}

interface WeeklyMealCalendarProps {
  meals: MealSchedule[];
  isLoading?: boolean;
}

export const WeeklyMealCalendar: React.FC<WeeklyMealCalendarProps> = ({ 
  meals, 
  isLoading = false 
}) => {
    // TODO: Get weekly meals from tRPC
  const { data: weeklyMeals } = trpc.meal.getWeekMeals.useQuery();

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const mealTimes = ['lunch', 'dinner'] as const;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Meal Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getMealForDay = (day: string, mealTime: 'lunch' | 'dinner') => {
    return meals.find(meal => 
      meal.date.includes(day) && meal.mealTime === mealTime
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Meal Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 text-center">
          {daysOfWeek.map(day => (
            <div key={day} className="font-medium text-sm text-gray-600 mb-2">
              {day}
            </div>
          ))}
          
          {daysOfWeek.map(day => (
            <div key={`${day}-meals`} className="space-y-2">
              {mealTimes.map(mealTime => {
                const meal = getMealForDay(day, mealTime);
                return (
                  <div key={`${day}-${mealTime}`} 
                       className="p-2 border rounded text-xs">
                    <div className="font-medium capitalize">{mealTime}</div>
                    {meal ? (
                      <MealStatusBadge status={meal.status} />
                    ) : (
                      <span className="text-gray-400">Available</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
