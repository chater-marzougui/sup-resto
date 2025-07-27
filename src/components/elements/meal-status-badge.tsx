import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScheduleStatusType } from '@/server/db/enums';
import { AlertCircle, Flame, CheckCircle2, CheckCheck, XCircle, RefreshCw } from 'lucide-react';

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


export const getMealStatusBadgeVariant = (status: ScheduleStatusType | undefined) => {
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


export const getMealStatusIcon = (status: ScheduleStatusType): React.JSX.Element => {
  const iconProps = { className: "w-4 h-4" };
  
  switch (status) {
    case "not_created":
      return <AlertCircle {...iconProps} className="w-4 h-4 text-red-200" />;
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

export const getMealStatusColor = (status: ScheduleStatusType): string => {
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