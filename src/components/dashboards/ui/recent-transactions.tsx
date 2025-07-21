
// src/components/dashboard/recent-transactions.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionTypeBadge } from '@/components/elements/transaction-type-badge';
import { BaseTransaction } from '@/server/trpc/validators/transactions-validator';
import { formatCurrency } from '@/lib/utils/main-utils';

interface RecentTransactionsProps {
  transactions: BaseTransaction[];
  isLoading?: boolean;
  limit?: number;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ 
  transactions, 
  isLoading = false,
  limit = 10
}) => {
  // TODO: Get recent transactions from tRPC
  // const { data: recentTransactions } = api.transactions.getRecent.useQuery({ limit });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex justify-between items-center">
                <div className="flex space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            No recent transactions. Start by recharging your account!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.slice(0, limit).map((transaction) => (
            <div key={transaction.id} 
                 className="flex justify-between items-center py-2 border-b last:border-b-0">
              <div className="flex items-center space-x-3">
                <TransactionTypeBadge type={transaction.type} />
                <div>
                  <p className="text-sm text-gray-600">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`font-medium ${
                  transaction.type === 'balance_recharge' || transaction.type === 'refund'
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {transaction.type === 'balance_recharge' || transaction.type === 'refund' 
                    ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
