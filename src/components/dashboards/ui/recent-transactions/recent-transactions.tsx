// src/components/dashboard/recent-transactions.tsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Eye } from "lucide-react";
import PaginatedTransactionsModal from "./allTransactions-popup";
import TransactionLine from "./transaction-line";

interface RecentTransactionsProps {
  userId: string;
  limit?: number;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  userId,
  limit = 7,
}) => {
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const { 
    data: transactions, 
    isLoading, 
    error,
    refetch 
  } = trpc.transaction.getUserTransactionHistory.useQuery(
    { userId, limit },
    { 
      enabled: !!userId,
      staleTime: 0,
      refetchOnWindowFocus: true,
      refetchOnMount: true
    }
  );

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">Error loading transactions</p>
            <Button 
              onClick={() => refetch()}
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Button disabled variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse flex justify-between items-center"
              >
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

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Button 
            onClick={() => setShowAllTransactions(true)}
            variant="outline" 
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            View All
          </Button>
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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Button 
            onClick={() => setShowAllTransactions(true)}
            variant="outline" 
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.slice(0, limit).map((transaction) => (
              <TransactionLine transaction={transaction} />
            ))}
          </div>
        </CardContent>
      </Card>

      <PaginatedTransactionsModal
        userId={userId}
        isOpen={showAllTransactions}
        onClose={() => setShowAllTransactions(false)}
      />
    </>
  );
};