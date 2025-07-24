// src/components/dashboard/low-balance-alert.tsx
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface LowBalanceAlertProps {
  currentBalance: number;
  mealPrice: number;
}

export const LowBalanceAlert: React.FC<LowBalanceAlertProps> = ({
  currentBalance,
  mealPrice
}) => {
  const mealsLeft = Math.floor(currentBalance / mealPrice);

  let message: React.ReactNode = null;
  let colorScheme = {
    border: '',
    bg: '',
    icon: '',
    text: ''
  };

  if (currentBalance < 0) {
    colorScheme = {
      border: "border-red-300",
      bg: "bg-red-50",
      icon: "text-red-600",
      text: "text-red-800"
    };

    message = (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={colorScheme.text}>
            Your balance is below 0! You can still get meals, but please recharge soon.
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-sm text-muted-foreground">
          We allow a few meals in red, if you forget to recharge.
        </TooltipContent>
      </Tooltip>
    );
  } else if (mealsLeft <= 2) {
    colorScheme = {
      border: "border-yellow-300",
      bg: "bg-yellow-50",
      icon: "text-yellow-600",
      text: "text-yellow-800"
    };

    message = (
      <span className={colorScheme.text}>
        Low balance! You can only afford {mealsLeft} more meal{mealsLeft !== 1 ? 's' : ''}.
      </span>
    );
  }

  if (!message) return null;



  return (
    <Alert className={`${colorScheme.border} ${colorScheme.bg} ${colorScheme.text} `}>
      <AlertTriangle  className={`h-4 w-4 text-destructive`}/>
      <AlertDescription className="flex justify-between items-center">
        {message}
      </AlertDescription>
    </Alert>
  );
};
