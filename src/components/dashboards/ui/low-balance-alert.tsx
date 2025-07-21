
// src/components/dashboard/low-balance-alert.tsx
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard } from 'lucide-react';

interface LowBalanceAlertProps {
  currentBalance: number;
  mealPrice: number;
}

export const LowBalanceAlert: React.FC<LowBalanceAlertProps> = ({
  currentBalance,
  mealPrice
}) => {
  const mealsLeft = Math.floor(currentBalance / mealPrice);
  const shouldShowAlert = mealsLeft <= 2;

  if (!shouldShowAlert) return null;

  return (
    <Alert className="border-yellow-300 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex justify-between items-center">
        <span className="text-yellow-800">
          Low balance! You can only afford {mealsLeft} more meal{mealsLeft !== 1 ? 's' : ''}.
        </span>
      </AlertDescription>
    </Alert>
  );
};
