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
import { Calendar, CheckCircle2, XCircle, Settings } from "lucide-react";
import { MealType } from "@/server/db/enums";
import {
  getMealStatusBadgeVariant,
  getMealStatusIcon,
} from "@/components/elements/meal-status-badge";
import {
  canScheduleMeal,
  canCancelMeal,
  dayMealData,
  daysOfWeek,
} from "@/lib/utils/meal-utils";

type ActionType = "schedule" | "cancel";
type MealSelection = {
  day: string;
  mealType: MealType;
};

interface ScheduleMealDialogProps {
  weeklyMeals: (dayMealData | undefined)[];
  onScheduleMeals?: (
    selectedDays: string[],
    mealTypes: string[],
    action: ActionType
  ) => void;
}

const weekdayToday = new Date().getDay() === 0 ? 0 : new Date().getDay() - 1;
const DAYS = daysOfWeek.slice(weekdayToday);

const DayMealsSelection: React.FC<{
  day: string;
  dayData?: dayMealData;
  selectedMeals: MealSelection[];
  selectedAction: ActionType;
  onMealToggle: (day: string, mealType: MealType) => void;
}> = ({ day, dayData, selectedMeals, selectedAction, onMealToggle }) => {
  // Don't render if no data or day is in the past
  if (!dayData || dayData.lunch.scheduledDate < new Date()) {
    return null;
  }

  const actionCheck =
    selectedAction === "schedule" ? canScheduleMeal : canCancelMeal;
  const canSelectLunch = actionCheck(dayData.lunch);
  const canSelectDinner = actionCheck(dayData.dinner);

  const isLunchSelected = selectedMeals.some(
    (meal) => meal.day === day && meal.mealType === "lunch"
  );
  const isDinnerSelected = selectedMeals.some(
    (meal) => meal.day === day && meal.mealType === "dinner"
  );

  const isAlreadyChecked = (mealType: MealType) => {
    if (selectedAction === "schedule") {
      return dayData[mealType].status === "scheduled";
    } else if (selectedAction === "cancel") {
      const statuses = ["redeemed", "refunded"];
      return statuses.includes(dayData[mealType].status);
    }
    return false;
  };

  return (
    <div className="p-3 border rounded-lg">
      <div className="text-sm font-medium mb-3 text-center">{day}</div>

      <div className="flex space-x-2">
        {/* Lunch */}
        <div className="flex items-center justify-center space-x-2">
          <Checkbox
            id={`${day}-lunch`}
            checked={isLunchSelected || isAlreadyChecked("lunch")}
            disabled={!canSelectLunch}
            onCheckedChange={() => onMealToggle(day, "lunch")}
          />
          <label
            htmlFor={`${day}-lunch`}
            className="flex items-center gap-2 text-xs cursor-pointer flex-1"
          >
            <Badge
              variant={getMealStatusBadgeVariant(dayData.lunch?.status)}
              className="text-xs"
            >
              L: {getMealStatusIcon(dayData.lunch?.status)}
            </Badge>
          </label>
        </div>

        {/* Dinner */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${day}-dinner`}
            checked={isDinnerSelected || isAlreadyChecked("dinner")}
            disabled={!canSelectDinner}
            onCheckedChange={() => onMealToggle(day, "dinner")}
          />
          <label
            htmlFor={`${day}-dinner`}
            className="flex items-center gap-2 text-xs cursor-pointer flex-1"
          >
            <Badge
              variant={getMealStatusBadgeVariant(dayData.dinner?.status)}
              className="text-xs"
            >
              D: {getMealStatusIcon(dayData.dinner?.status)}
            </Badge>
          </label>
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
  const [selectedMeals, setSelectedMeals] = useState<MealSelection[]>([]);
  const [selectedAction, setSelectedAction] = useState<ActionType>("schedule");

  // Filter out past days and undefined meals
  const weeklyMealsData = weeklyMeals.filter((meal) => {
    return (
      meal !== undefined &&
      (meal?.lunch?.scheduledDate >= new Date() ||
        meal?.dinner?.scheduledDate >= new Date())
    );
  });

  const handleMealToggle = (day: string, mealType: MealType) => {
    setSelectedMeals((prev) => {
      const existingIndex = prev.findIndex(
        (meal) => meal.day === day && meal.mealType === mealType
      );

      if (existingIndex >= 0) {
        // Remove if already selected
        return prev.filter((_, index) => index !== existingIndex);
      } else {
        // Add new selection
        return [...prev, { day, mealType }];
      }
    });
  };

  const handleSelectAllAvailable = () => {
    const actionCheck =
      selectedAction === "schedule" ? canScheduleMeal : canCancelMeal;
    const availableMeals: MealSelection[] = [];

    DAYS.forEach((day) => {
      const dayData = weeklyMealsData.find((meal) => meal?.day === day);
      if (dayData) {
        if (actionCheck(dayData.lunch)) {
          availableMeals.push({ day, mealType: "lunch" });
        }
        if (actionCheck(dayData.dinner)) {
          availableMeals.push({ day, mealType: "dinner" });
        }
      }
    });

    setSelectedMeals(availableMeals);
  };

  const clearSelections = () => {
    setSelectedMeals([]);
  };

  const handleSubmit = () => {
    if (selectedMeals.length === 0) return;

    // Group selections by day and meal type for the callback
    const selectedDays = [...new Set(selectedMeals.map((meal) => meal.day))];
    const selectedMealTypes = [
      ...new Set(selectedMeals.map((meal) => meal.mealType)),
    ];

    onScheduleMeals?.(selectedDays, selectedMealTypes, selectedAction);
    setIsOpen(false);
    clearSelections();
  };

  const handleActionChange = (action: ActionType) => {
    setSelectedAction(action);
    // Clear selections when action changes since availability might change
    setSelectedMeals([]);
  };

  const hasSelections = selectedMeals.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Manage Meals
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto custom-scrollbar">
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
                onClick={() => handleActionChange("schedule")}
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Schedule Meals
              </Button>
              <Button
                variant={selectedAction === "cancel" ? "default" : "outline"}
                size="sm"
                onClick={() => handleActionChange("cancel")}
                className="flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Cancel Meals
              </Button>
            </div>
          </div>

          <Separator />

          {/* Day Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Select Meals</h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllAvailable}
                >
                  Select All Available
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSelections}>
                  Clear All
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {DAYS.map((day) => (
                <DayMealsSelection
                  key={day}
                  day={day}
                  dayData={weeklyMealsData.find((meal) => meal?.day === day)}
                  selectedMeals={selectedMeals}
                  selectedAction={selectedAction}
                  onMealToggle={handleMealToggle}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 justify-end">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
          <Button onClick={handleSubmit} disabled={!hasSelections}>
            {selectedAction === "schedule"
              ? "Schedule Selected Meals"
              : "Cancel Selected Meals"}
            {hasSelections && ` (${selectedMeals.length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
