// src/components/dashboard/monthly-summary-card.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface MonthlySummaryCardProps {
  currentMonth: {
    spending: number;
    mealsConsumed: number;
    averageDailyCost: number;
  };
  previousMonth: {
    spending: number;
    mealsConsumed: number;
  };
  isLoading?: boolean;
}

export const MonthlySummaryCard: React.FC<MonthlySummaryCardProps> = ({
  currentMonth,
  previousMonth,
  isLoading = false
}) => {
  // TODO: Get monthly summary from tRPC
  // const { data: monthlyData } = api.analytics.getMonthlySummary.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const spendingChange = currentMonth.spending - previousMonth.spending;
  const mealsChange = currentMonth.mealsConsumed - previousMonth.mealsConsumed;
  const spendingPercentChange = previousMonth.spending > 0 
    ? ((spendingChange / previousMonth.spending) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5" />
          <span>Monthly Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Spending</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{currentMonth.spending.toFixed(2)} TND</span>
              {spendingChange !== 0 && (
                <div className={`flex items-center text-xs ${
                  spendingChange > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {spendingChange > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(spendingPercentChange).toFixed(1)}%
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Meals Consumed</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{currentMonth.mealsConsumed}</span>
              {mealsChange !== 0 && (
                <div className={`flex items-center text-xs ${
                  mealsChange > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {mealsChange > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(mealsChange)}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Daily Average</span>
            <span className="font-medium">{currentMonth.averageDailyCost.toFixed(2)} TND</span>
          </div>

          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Compared to last month • {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
