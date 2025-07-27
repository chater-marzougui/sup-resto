// src/components/dashboard/schedule-meal-dialog.tsx
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Calendar,
  Utensils,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {  } from "@/lib/utils/meal-utils";
import { ScheduleStatusType, MealType } from "@/server/db/enums";
import {
  getMealStatusColor,
  getMealStatusIcon,
} from "@/components/elements/meal-status-badge";
import { canScheduleMeal, canCancelMeal, dayMealData, daysOfWeek } from "@/lib/utils/meal-utils";
import { MealScheduleWithUser } from "@/server/trpc/services/meal-service";
interface ScheduleMealDialogProps {
  weeklyMeals: (dayMealData | undefined)[];
  onScheduleMeals?: (
    selectedDays: string[],
    mealTypes: string[],
    action: "schedule" | "cancel"
  ) => void;
}

type ActionType = "schedule" | "cancel";
const weekdayToday = new Date().getDay() === 0 ? 0 : new Date().getDay() - 1;

const DAYS = daysOfWeek.slice(weekdayToday);
const MEAL_TIMES: MealType[] = ["lunch", "dinner"];

const canTakeAction = (
  action: (meal: MealScheduleWithUser) => boolean,
  meal?: MealScheduleWithUser,
): boolean => {
  if (!meal) return false;
  return action(meal);
};

const getStatusBadgeVariant = (status: ScheduleStatusType | undefined) => {
  switch (status) {
    case "scheduled":
      return "default";
    case "redeemed":
      return "secondary";
    case "cancelled":
      return "destructive";
    case "refunded":
      return "outline";
    case "expired":
      return "destructive";
    default:
      return "outline";
  }
};

const DayMealsSelection: React.FC<{
  day: string;
  dayData?: dayMealData;
  selectedDays: string[];
  action: (meal: MealScheduleWithUser) => boolean;
  onDayToggle: (day: string) => void;
}> = ({ day, dayData, selectedDays, action, onDayToggle }) => {
  if (
    !dayData ||
    dayData.lunch.scheduledDate < new Date()
  ) {
    return <div className="flex-1" />;
  }
  const isSelected = selectedDays.includes(day);
  const canSelectLunch = action(dayData.lunch);
  const canSelectDinner = action(dayData.dinner);

  return (
    <div className="flex items-center space-x-3 p-3 border rounded-lg">
      <div className="flex-1 min-w-0">
        <label
          htmlFor={`day-${day}`}
          className="text-sm font-medium cursor-pointer"
        >
          {day}
        </label>
        <div className="flex gap-1 mt-1">
          {(["lunch", "dinner"] as MealType[]).map((mealTime) => {
            const status = dayData?.[mealTime]?.status;
            const isSelectable =
              mealTime === "lunch" ? canSelectLunch : canSelectDinner;
            return (
              <>
                <Checkbox
                  id={`day-${day}-${mealTime}`}
                  checked={isSelected}
                  disabled={!isSelectable}
                  onCheckedChange={() => onDayToggle(day)}
                />
                <Badge
                  key={mealTime}
                  variant={getStatusBadgeVariant(status)}
                  className="text-xs"
                >
                  {mealTime.charAt(0).toUpperCase()}: {getMealStatusIcon(status)}
                </Badge>
              </>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ScheduleMealDialog: React.FC<ScheduleMealDialogProps> = ({
  weeklyMeals,
  onScheduleMeals,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedMealTimes, setSelectedMealTimes] = useState<MealType[]>([]);
  const [selectedAction, setSelectedAction] = useState<ActionType>("schedule");
  console.log("ScheduleMealDialog", weeklyMeals);
  const weeklyMealsData = weeklyMeals.filter((meal) => {
    return meal !== undefined &&
    (meal?.lunch?.scheduledDate >= new Date() ||
           meal?.dinner?.scheduledDate >= new Date());
  });

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleMealTimeToggle = (mealTime: MealType) => {
    setSelectedMealTimes((prev) =>
      prev.includes(mealTime)
        ? prev.filter((mt) => mt !== mealTime)
        : [...prev, mealTime]
    );
  };

  const handleSelectAllDays = () => {
    const availableDays = DAYS.filter((day) => {
      const dayData = weeklyMealsData.find((meal) => meal?.day === day);
      if (!dayData) return true;
      const action = selectedAction === "schedule" ? canScheduleMeal : canCancelMeal;

      // Check if any meal time can take the selected action
      return selectedMealTimes.some((mealTime) => {
        return canTakeAction(action, dayData[mealTime]);
      });
    });

    setSelectedDays(availableDays);
  };

  const handleSelectAllMealTimes = () => {
    setSelectedMealTimes([...MEAL_TIMES]);
  };

  const clearSelections = () => {
    setSelectedDays([]);
    setSelectedMealTimes([]);
  };

  const handleSubmit = () => {
    if (selectedDays.length === 0 || selectedMealTimes.length === 0) return;

    onScheduleMeals?.(selectedDays, selectedMealTimes, selectedAction);
    setIsOpen(false);
    clearSelections();
  };

  const hasSelections = selectedDays.length > 0 && selectedMealTimes.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Schedule Meals
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Batch Meal Actions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Selection */}
          <div>
            <h3 className="text-sm font-medium mb-3">Action</h3>
            <div className="flex gap-2">
              <Button
                variant={selectedAction === "schedule" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedAction("schedule")}
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Schedule
              </Button>
              <Button
                variant={selectedAction === "cancel" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedAction("cancel")}
                className="flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </div>

          <Separator />

          {/* Day Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Days</h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleSelectAllDays}>
                  Select Available
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDays([])}
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {DAYS.map((day) => {
                return (
                  <DayMealsSelection
                    key={day}
                    day={day}
                    dayData={weeklyMealsData.find((meal) => meal?.day === day)}
                    selectedDays={selectedDays}
                    action={canCancelMeal}
                    onDayToggle={handleDayToggle}
                  />
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Meal Time Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Meal Times</h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllMealTimes}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMealTimes([])}
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="flex gap-3">
              {MEAL_TIMES.map((mealTime) => (
                <div
                  key={mealTime}
                  className="flex items-center space-x-3 p-3 border rounded-lg flex-1"
                >
                  <Checkbox
                    id={`meal-${mealTime}`}
                    checked={selectedMealTimes.includes(mealTime)}
                    onCheckedChange={() => handleMealTimeToggle(mealTime)}
                  />
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4" />
                    <label
                      htmlFor={`meal-${mealTime}`}
                      className="text-sm font-medium cursor-pointer capitalize"
                    >
                      {mealTime}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!hasSelections}
            className="flex-1"
          >
            {selectedAction === "schedule"
              ? "Schedule Selected Meals"
              : "Cancel Selected Meals"}
          </Button>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
