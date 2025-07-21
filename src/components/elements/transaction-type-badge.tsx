
// src/components/ui/transaction-type-badge.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TransactionType } from '@/server/db/enums';


interface TransactionTypeBadgeProps {
  type: TransactionType;
}

const typeConfig = {
  balance_recharge: { label: 'Recharge', className: 'bg-green-100 text-green-800' },
  meal_schedule: { label: 'Meal Booked', className: 'bg-blue-100 text-blue-800' },
  refund: { label: 'Refund', className: 'bg-yellow-100 text-yellow-800' },
  meal_redemption: { label: 'Meal Used', className: 'bg-purple-100 text-purple-800' },
  balance_adjustment: { label: 'Adjustment', className: 'bg-gray-100 text-gray-800' },
};

export const TransactionTypeBadge: React.FC<TransactionTypeBadgeProps> = ({ type }) => {
  const config = typeConfig[type];
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
};