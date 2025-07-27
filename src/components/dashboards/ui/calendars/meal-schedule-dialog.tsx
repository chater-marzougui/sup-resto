// src/components/dashboard/schedule-meal-dialog.tsx
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Calendar, Utensils, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { dayMealData } from "@/lib/utils/meal-utils";
import { ScheduleStatusType, MealType } from "@/server/db/enums";

interface ScheduleMealDialogProps {
  weeklyMeals: (dayMealData | undefined)[];
  onScheduleMeals?: (selectedDays: string[], mealTypes: string[], action: 'schedule' | 'cancel') => void;
}

type ActionType = 'schedule' | 'cancel';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEAL_TIMES: MealType[] = ['lunch', 'dinner'];

const canTakeAction = (status: ScheduleStatusType | undefined, action: ActionType): boolean => {
  if (!status) return action === 'schedule';
  
  if (action === 'schedule') {
    return status !== 'scheduled' && status !== 'expired';
  } else if (action === 'cancel') {
    return status === 'scheduled';
  }
  
  return false;
};

const getStatusBadgeVariant = (status: ScheduleStatusType | undefined) => {
  switch (status) {
    case 'scheduled': return 'default';
    case 'redeemed': return 'secondary';
    case 'cancelled': return 'destructive';
    case 'refunded': return 'outline';
    case 'expired': return 'destructive';
    default: return 'outline';
  }
};

const getStatusLabel = (status: ScheduleStatusType | undefined): string => {
  switch (status) {
    case 'not_created': return 'Available';
    case 'scheduled': return 'Scheduled';
    case 'redeemed': return 'Redeemed';
    case 'cancelled': return 'Cancelled';
    case 'refunded': return 'Refunded';
    case 'expired': return 'Expired';
    default: return 'Available';
  }
};

export const ScheduleMealDialog: React.FC<ScheduleMealDialogProps> = ({
  weeklyMeals,
  onScheduleMeals,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedMealTimes, setSelectedMealTimes] = useState<MealType[]>([]);
  const [selectedAction, setSelectedAction] = useState<ActionType>('schedule');

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleMealTimeToggle = (mealTime: MealType) => {
    setSelectedMealTimes(prev =>
      prev.includes(mealTime)
        ? prev.filter(mt => mt !== mealTime)
        : [...prev, mealTime]
    );
  };

  const handleSelectAllDays = () => {
    const availableDays = DAYS.filter(day => {
      const dayData = weeklyMeals.find(meal => meal?.day === day);
      if (!dayData) return true;
      
      // Check if any meal time can take the selected action
      return selectedMealTimes.some(mealTime => {
        const mealStatus = dayData[mealTime]?.status;
        return canTakeAction(mealStatus, selectedAction);
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

  const getValidSelections = () => {
    let validCount = 0;
    let invalidCount = 0;

    selectedDays.forEach(day => {
      const dayData = weeklyMeals.find(meal => meal?.day === day);
      selectedMealTimes.forEach(mealTime => {
        const mealStatus = dayData?.[mealTime]?.status;
        if (canTakeAction(mealStatus, selectedAction)) {
          validCount++;
        } else {
          invalidCount++;
        }
      });
    });

    return { validCount, invalidCount };
  };

  const { validCount, invalidCount } = getValidSelections();
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
                variant={selectedAction === 'schedule' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedAction('schedule')}
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Schedule
              </Button>
              <Button
                variant={selectedAction === 'cancel' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedAction('cancel')}
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
                <Button variant="ghost" size="sm" onClick={() => setSelectedDays([])}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {DAYS.map((day) => {
                const dayData = weeklyMeals.find(meal => meal?.day === day);
                const isSelected = selectedDays.includes(day);
                
                return (
                  <div key={day} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={`day-${day}`}
                      checked={isSelected}
                      onCheckedChange={() => handleDayToggle(day)}
                    />
                    <div className="flex-1 min-w-0">
                      <label htmlFor={`day-${day}`} className="text-sm font-medium cursor-pointer">
                        {day}
                      </label>
                      <div className="flex gap-1 mt-1">
                        {(['lunch', 'dinner'] as MealType[]).map(mealTime => {
                          const status = dayData?.[mealTime]?.status;
                          return (
                            <Badge 
                              key={mealTime} 
                              variant={getStatusBadgeVariant(status)}
                              className="text-xs"
                            >
                              {mealTime.charAt(0).toUpperCase()}: {getStatusLabel(status)}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>
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
                <Button variant="ghost" size="sm" onClick={handleSelectAllMealTimes}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedMealTimes([])}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="flex gap-3">
              {MEAL_TIMES.map((mealTime) => (
                <div key={mealTime} className="flex items-center space-x-3 p-3 border rounded-lg flex-1">
                  <Checkbox
                    id={`meal-${mealTime}`}
                    checked={selectedMealTimes.includes(mealTime)}
                    onCheckedChange={() => handleMealTimeToggle(mealTime)}
                  />
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4" />
                    <label htmlFor={`meal-${mealTime}`} className="text-sm font-medium cursor-pointer capitalize">
                      {mealTime}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selection Summary */}
          {hasSelections && (
            <>
              <Separator />
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Selection Summary
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Days: {selectedDays.join(', ')}</p>
                  <p>Meal Times: {selectedMealTimes.map(mt => mt.charAt(0).toUpperCase() + mt.slice(1)).join(', ')}</p>
                  <p>Action: <span className="capitalize font-medium">{selectedAction}</span></p>
                  
                  {validCount > 0 && (
                    <div className="flex items-center gap-1 text-green-600 mt-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{validCount} valid selections</span>
                    </div>
                  )}
                  
                  {invalidCount > 0 && (
                    <div className="flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{invalidCount} selections will be skipped (invalid status)</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!hasSelections || validCount === 0}
            className="flex-1"
          >
            {selectedAction === 'schedule' ? 'Schedule Selected Meals' : 'Cancel Selected Meals'}
            {validCount > 0 && ` (${validCount})`}
          </Button>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};