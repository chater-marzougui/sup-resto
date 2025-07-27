// src/components/dashboard/weekly-meal-calendar.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { daysOfWeek, formatWeeklyMeals, dayMealData } from "@/lib/utils/meal-utils";
import { MealScheduleWithUser } from "@/server/trpc/services/meal-service";
import { ScheduleStatusType } from "@/server/db/enums";
import {
  Calendar,
  CheckCircle2,
  CheckCheck,
  XCircle,
  RefreshCw,
  AlertCircle,
  Flame,
  Plus,
  Utensils,
  Moon,
} from "lucide-react";
import { ScheduleMealDialog } from "./meal-schedule-dialog";

interface WeeklyMealCalendarProps {
  meals: MealScheduleWithUser[];
  isLoading?: boolean;
  onScheduleMeals?: (selectedDays: string[], mealTypes: string[]) => void;
}

const mealStatusIcon = (status: ScheduleStatusType): React.JSX.Element => {
  const iconProps = { className: "w-4 h-4" };
  
  switch (status) {
    case "not_created":
      return <AlertCircle {...iconProps} className="w-4 h-4 text-red-400" />;
    case "expired":
      return <Flame {...iconProps} className="w-4 h-4 text-destructive" />;
    case "scheduled":
      return <CheckCircle2 {...iconProps} className="w-4 h-4 text-green-600 dark:text-green-500" />;
    case "redeemed":
      return <CheckCheck {...iconProps} className="w-4 h-4 text-green-700 dark:text-green-400" />;
    case "cancelled":
      return <XCircle {...iconProps} className="w-4 h-4 text-destructive" />;
    case "refunded":
      return <RefreshCw {...iconProps} className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    default:
      return <AlertCircle {...iconProps} className="w-4 h-4 text-muted-foreground" color="red" />;
  }
};

const getStatusColor = (status: ScheduleStatusType): string => {
  switch (status) {
    case "not_created":
      return "border-muted-foreground/20 bg-muted/10";
    case "expired":
      return "border-destructive/20 bg-destructive/5";
    case "scheduled":
      return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20";
    case "redeemed":
      return "border-green-300 bg-green-100 dark:border-green-700 dark:bg-green-900/30";
    case "cancelled":
      return "border-destructive/20 bg-destructive/5";
    case "refunded":
      return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20";
    default:
      return "border-muted-foreground/20 bg-muted/10";
  }
};

const DayElement = ({ data }: { data?: dayMealData }): React.JSX.Element => {
  if (!data) return <div className="flex-1" />;

  return (
    <div className="flex-1 min-w-0">
      <div className="font-medium text-sm text-foreground mb-3 text-center">
        {data.day}
      </div>

      <div className="space-y-2">
        {/* Lunch */}
        <div className={`p-2 border rounded-lg text-xs transition-colors ${getStatusColor(data.lunch?.status ?? "not_created")}`}>
          <div className="flex items-center justify-center mb-1">
            {mealStatusIcon(data.lunch?.status ?? "not_created")}
          </div>
        </div>

        {/* Dinner */}
        <div className={`p-2 border rounded-lg text-xs transition-colors ${getStatusColor(data.dinner?.status ?? "not_created")}`}>
          <div className="flex items-center justify-center mb-1">
            {mealStatusIcon(data.dinner?.status ?? "not_created")}
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
            Weekly Meal Schedule
          </CardTitle>
          <ScheduleMealDialog weeklyMeals={weeklyMeals} onScheduleMeals={onScheduleMeals} />
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
          <div className="text-xs text-muted-foreground mb-2">Status Legend:</div>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-muted-foreground" color="red" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-600" />
              <span>Scheduled</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCheck className="w-3 h-3 text-green-700" />
              <span>Redeemed</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="w-3 h-3 text-destructive" />
              <span>Cancelled</span>
            </div>
            <div className="flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-blue-600" />
              <span>Refunded</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-destructive" />
              <span>Expired</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};