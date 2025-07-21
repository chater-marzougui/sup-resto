import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScheduleStatusType } from '@/server/db/enums';

interface MealStatusBadgeProps {
  status: ScheduleStatusType;
}

const statusConfig = {
  not_created: { label: 'Not Scheduled', className: 'bg-gray-200 text-gray-800' },
  scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-200 text-red-800' },
  redeemed: { label: 'Redeemed', className: 'bg-green-100 text-green-800' },
  expired: { label: 'Expired', className: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', className: 'bg-yellow-100 text-yellow-800' },
};

export const MealStatusBadge: React.FC<MealStatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status];
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
};
