import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionWithProcessedBy } from "@/server/trpc/validators/transactions-validator";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import TransactionLine from './transaction-line';   

interface PaginatedTransactionsModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PaginatedTransactionsModal: React.FC<PaginatedTransactionsModalProps> = ({
  userId,
  isOpen,
  onClose,
}) => {
  const [allTransactions, setAllTransactions] = useState<TransactionWithProcessedBy[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const pageSize = 15;

  const { data, isLoading, isFetching } = trpc.transaction.getAllTransactions.useQuery(
    { 
      userId, 
      cursor,
      limit: pageSize 
    },
    { 
      enabled: isOpen && !!userId,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    }
  );

  useEffect(() => {
    if (isOpen) {
      setCursor(undefined);
      setAllTransactions([]);
      setHasNextPage(true);
      setIsLoadingMore(false);
    }
  }, [isOpen]);

  // Handle new data
  useEffect(() => {
    if (data?.transactions && isOpen) {
      if (!cursor) {
        // First load - replace all
        setAllTransactions(data.transactions);
      } else {
        // Subsequent loads - append new transactions
        setAllTransactions(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const newTransactions = data.transactions.filter(t => !existingIds.has(t.id));
          return [...prev, ...newTransactions];
        });
      }

      setHasNextPage(data.hasNextPage);
      setIsLoadingMore(false);
    }
  }, [data, isOpen, cursor]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isLoading && !isFetching && !isLoadingMore && data?.nextCursor) {
      setIsLoadingMore(true);
      setCursor(data.nextCursor);
    }
  }, [hasNextPage, isLoading, isFetching, isLoadingMore, data?.nextCursor]);

  // Scroll handler
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || isLoadingMore || !hasNextPage) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 100;

    if (allTransactions.length > 0 && scrollHeight - scrollTop - clientHeight < threshold) {
      loadMore();
    }
  }, [loadMore, allTransactions.length, isLoadingMore, hasNextPage]);

  // Set up scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && isOpen) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll, isOpen]);

  // Loading state for initial load
  if ((isLoading && !cursor) || (!data && isOpen && !isLoading)) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose} aria-label="Recent Transactions">
        <DialogContent className="w-[80%] max-w-2xl max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-6 border-b">
            <DialogTitle className="text-xl font-semibold">All Transactions</DialogTitle>
          </DialogHeader>
          <div className="flex-1 px pb-6">
            <div className="space-y-4 pt-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse flex justify-between items-center py-3">
                  <div className="flex space-x-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose} aria-label="Recent Transactions">
      <DialogContent 
        aria-description="View all transactions for the user" 
        className="w-[80%] max-w-2xl max-h-[80vh] flex flex-col p-0"
      >
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle className="text-xl font-semibold">All Transactions</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 pl-6 pb-6">
          <div 
            ref={scrollContainerRef}
            className="h-full overflow-y-auto pr-2 pt-3 custom-scrollbar"
            style={{ 
              maxHeight: 'calc(80vh - 80px)',
            }}
          >
            {allTransactions.length === 0 && !isLoading ? (
              <p className="text-muted-foreground text-center py-8">
                No transactions found.
              </p>
            ) : (
              <div className="space-y-3">
                {allTransactions.map((transaction) => (
                  <TransactionLine key={transaction.id} transaction={transaction} />
                ))}

                {/* Loading more indicator */}
                {isLoadingMore && (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                )}

                {/* End of results */}
                {!hasNextPage && allTransactions.length > 0 && (
                  <p className="text-center text-muted-foreground py-4 text-sm">
                    No more transactions
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaginatedTransactionsModal;