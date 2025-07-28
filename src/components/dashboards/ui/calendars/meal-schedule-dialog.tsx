// src/components/dashboard/schedule-meal-dialog.tsx
import React, { useState, useRef, useEffect } from "react";
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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/use-auth";
import LoadingSpinner from "@/components/elements/LoadingSpinner";

type ActionType = "schedule" | "cancel";
type MealSelection = {
  day: string;
  mealDate: Date;
  mealType: MealType;
};

interface ScheduleMealDialogProps {
  weeklyMeals: (dayMealData | undefined)[];
  onScheduleMeals?: (
    isSuccess: boolean,
  ) => void;
}

const weekdayToday = new Date().getDay() === 0 ? 0 : new Date().getDay() - 1;
const DAYS = daysOfWeek.slice(weekdayToday);

// Tab Navigation Component
const TabNavigation: React.FC<{
  selectedAction: ActionType;
  onActionChange: (action: ActionType) => void;
}> = ({ selectedAction, onActionChange }) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<HTMLDivElement>(null);
  const scheduleTabRef = useRef<HTMLButtonElement>(null);
  const cancelTabRef = useRef<HTMLButtonElement>(null);

  // Touch/swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && selectedAction === "schedule") {
      onActionChange("cancel");
    }
    if (isRightSwipe && selectedAction === "cancel") {
      onActionChange("schedule");
    }
  };

  // Update indicator position
  useEffect(() => {
    const updateIndicator = () => {
      const activeTab = selectedAction === "schedule" ? scheduleTabRef.current : cancelTabRef.current;
      const tabsContainer = tabsRef.current;
      
      if (activeTab && tabsContainer) {
        const containerRect = tabsContainer.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();
        
        setIndicatorStyle({
          left: tabRect.left - containerRect.left,
          width: tabRect.width,
        });
      }
    };

    updateIndicator();
    // Small delay to ensure DOM is updated
    const timer = setTimeout(updateIndicator, 50);
    return () => clearTimeout(timer);
  }, [selectedAction]);

  return (
    <div className="space-y-4">
      <div 
        ref={tabsRef}
        className="relative bg-gray-100 dark:bg-gray-800 rounded-lg p-1 max-w-md mx-auto"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Sliding indicator */}
        <div
          className="absolute top-1 bottom-1 bg-white dark:bg-gray-700 rounded-md shadow-sm transition-all duration-300 ease-out z-10"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />
        
        <div className="relative z-20 flex">
          <button
            ref={scheduleTabRef}
            onClick={() => onActionChange("schedule")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
              selectedAction === "schedule"
                ? "text-green-700 dark:text-green-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Schedule Meals
          </button>
          
          <button
            ref={cancelTabRef}
            onClick={() => onActionChange("cancel")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
              selectedAction === "cancel"
                ? "text-red-600 dark:text-red-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <XCircle className="w-4 h-4" />
            Cancel Meals
          </button>
        </div>
      </div>
    </div>
  );
};

const DayMealsSelection: React.FC<{
  day: string;
  dayData?: dayMealData;
  selectedMeals: MealSelection[];
  selectedAction: ActionType;
  onMealToggle: (day: string, mealDate: Date, mealType: MealType) => void;
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
    <div className="p-3 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <div className="text-sm font-medium mb-3 text-center text-gray-800 dark:text-gray-200">{day}</div>

      <div className="flex space-x-2">
        {/* Lunch */}
        <div className="flex items-center justify-center space-x-2">
          <Checkbox
            id={`${day}-lunch`}
            checked={isLunchSelected || isAlreadyChecked("lunch")}
            disabled={!canSelectLunch}
            onCheckedChange={() => onMealToggle(day, dayData.lunch?.scheduledDate, "lunch")}
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
            onCheckedChange={() => onMealToggle(day, dayData.dinner?.scheduledDate, "dinner")}
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
  const { user, isLoading } = useAuth();
  
  const utils = trpc.useUtils();
  const scheduleManyMealsMutation = trpc.meal.scheduleManyMeals.useMutation({
    onSuccess: () => {
      toast.success("Meals scheduled successfully");
      setSelectedMeals([]);
      utils.invalidate();
      setIsOpen(false);
      onScheduleMeals?.(true);
    },
    onError: (error) => {
      toast.error("Failed to schedule meals");
      console.error("Error scheduling meals:", error);
      onScheduleMeals?.(false);
    },
  });

  const cancelManyMealsMutation = trpc.meal.cancelManyMeals.useMutation({
    onSuccess: () => {
      toast.success("Meals cancelled successfully");
      setSelectedMeals([]);
      utils.invalidate();
      setIsOpen(false);
      onScheduleMeals?.(true);
    },
    onError: (error) => {
      toast.error("Failed to cancel meals");
      console.error("Error cancelling meals:", error);
      onScheduleMeals?.(false);
    },
  });

  // Filter out past days and undefined meals
  const weeklyMealsData = weeklyMeals.filter((meal) => {
    return (
      meal !== undefined &&
      (meal?.lunch?.scheduledDate >= new Date() ||
        meal?.dinner?.scheduledDate >= new Date())
    );
  });

  const handleMealToggle = (day: string, mealDate: Date, mealType: MealType) => {
    setSelectedMeals((prev) => {
      const existingIndex = prev.findIndex(
        (meal) => meal.day === day && meal.mealType === mealType
      );

      if (existingIndex >= 0) {
        // Remove if already selected
        return prev.filter((_, index) => index !== existingIndex);
      } else {
        // Add new selection
        return [...prev, { day, mealDate, mealType }];
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
          availableMeals.push({ day, mealDate: dayData.lunch?.scheduledDate, mealType: "lunch" });
        }
        if (actionCheck(dayData.dinner)) {
          availableMeals.push({ day, mealDate: dayData.dinner?.scheduledDate, mealType: "dinner" });
        }
      }
    });

    setSelectedMeals(availableMeals);
  };

  const clearSelections = () => {
    setSelectedMeals([]);
  };

  const handleSubmit = async () => {
    if (selectedMeals.length === 0) return;
    if (selectedAction === "schedule") {
      // Schedule meals
      await scheduleManyMealsMutation.mutateAsync({
        meals: selectedMeals.map((meal) => ({
          mealType: meal.mealType,
          mealDate: new Date(meal.mealDate),
        })),
        userId: user?.id!, // Assuming you have a way to get the current user ID
      });
    } else if (selectedAction === "cancel") {
      // Cancel meals
      await cancelManyMealsMutation.mutateAsync({
        meals: selectedMeals.map((meal) => ({
          mealType: meal.mealType,
          mealDate: new Date(meal.mealDate),
        })),
        userId: user?.id!,
      });
    }

    setIsOpen(false);
    clearSelections();
  };

  const handleActionChange = (action: ActionType) => {
    setSelectedAction(action);
    // Clear selections when action changes since availability might change
    setSelectedMeals([]);
  };

  const hasSelections = selectedMeals.length > 0;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <div>Error loading user data</div>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="hover:bg-gray-50 dark:hover:bg-gray-800">
          <Settings className="w-4 h-4 mr-2" />
          Manage Meals
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <Calendar className="w-5 h-5" />
            Batch Meal Actions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tab Navigation */}
          <TabNavigation
            selectedAction={selectedAction}
            onActionChange={handleActionChange}
          />

          <Separator className="bg-gray-200 dark:bg-gray-700" />

          {/* Day Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Meals</h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllAvailable}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  Select All Available
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearSelections}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
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
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            className="hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Close
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!hasSelections}
            className={`${
              selectedAction === "schedule"
                ? "bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
          >
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