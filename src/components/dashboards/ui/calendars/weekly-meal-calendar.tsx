// src/components/dashboard/weekly-meal-calendar.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatWeeklyMeals, dayMealData } from "@/lib/utils/meal-utils";
import { MealScheduleWithUser } from "@/server/trpc/services/meal-service";
import { Calendar } from "lucide-react";
import { ScheduleMealDialog } from "./meal-schedule-dialog";
import {
  getMealStatusColor,
  getMealStatusIcon,
} from "@/components/elements/meal-status-badge";
import { scheduleStatusEnum } from "@/server/db/enums";

interface WeeklyMealCalendarProps {
  meals: MealScheduleWithUser[];
  isLoading?: boolean;
  onScheduleMeals?: (isSuccess: boolean) => void;
  eatWithStudents?: boolean;
}

const DayElement = ({ data }: { data?: dayMealData }): React.JSX.Element => {
  if (!data) return <div className="flex-1" />;

  return (
    <div className="flex-1 min-w-0">
      <div className="font-medium text-sm text-foreground mb-3 text-center">
        {data.day}
      </div>

      <div className="space-y-2">
        {/* Lunch */}
        <div
          className={`p-2 border rounded-lg text-xs transition-colors ${getMealStatusColor(
            data.lunch?.status ?? "not_created"
          )}`}
        >
          <div className="flex items-center justify-center mb-1">
            {getMealStatusIcon(data.lunch?.status ?? "not_created")}
          </div>
        </div>

        {/* Dinner */}
        <div
          className={`p-2 border rounded-lg text-xs transition-colors ${getMealStatusColor(
            data.dinner?.status ?? "not_created"
          )}`}
        >
          <div className="flex items-center justify-center mb-1">
            {getMealStatusIcon(data.dinner?.status ?? "not_created")}
          </div>
        </div>
      </div>
    </div>
  );
};

export const WeeklyMealCalendar: React.FC<WeeklyMealCalendarProps> = ({
  meals,
  isLoading = false,
  onScheduleMeals,
  eatWithStudents = false,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Weekly Meal Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="flex gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-8 mx-auto"></div>
                  <div className="h-12 bg-muted rounded"></div>
                  <div className="h-12 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { weeklyMeals } = formatWeeklyMeals(meals);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Week's Schedule
          </CardTitle>
          <ScheduleMealDialog
            weeklyMeals={weeklyMeals}
            onScheduleMeals={onScheduleMeals}
            eatWithStudents={eatWithStudents}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 text-center overflow-x-auto pb-2">
          {weeklyMeals.map((dayData, index) => (
            <DayElement key={dayData.day || index} data={dayData} />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2">
            Status Legend:
          </div>
          <div className="flex flex-wrap gap-3 text-xs items-center">
            {scheduleStatusEnum.enumValues.map((status) => (
              <div key={status} className="flex items-center gap-2 mb-1">
                {getMealStatusIcon(status)}
                <span className="text-sm">
                  {status.charAt(0).toUpperCase() +
                    status.slice(1).replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
