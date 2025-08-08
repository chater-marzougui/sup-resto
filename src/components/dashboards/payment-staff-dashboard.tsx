import React, { useState, useEffect } from "react";
import { withDashboardLayout } from "./withDashboardLayout";
import { RoleEnum } from "@/server/db/enums";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";
import { formatCurrency, formatDate } from "@/lib/utils/main-utils";
import { StatCard } from "../elements/stat-card";
import { PaymentDepositCard } from "./ui/payment-deposit-card";
import { useOnlineStatus } from "@/hooks/use-Online";
import { RecentTransactions } from "./ui/recent-transactions/recent-transactions";
import { StatusIndicator } from "../elements/isOnlineElement";

const PaymentStaffDashboardComponent = () => {
  const { user, isLoadingUser } = useProfile();
  const { userOnline, serverOnline } = useOnlineStatus();
  const [offlineTransactions, setOfflineTransactions] = useState<any[]>([]);
  const utils = trpc.useUtils();

  // tRPC queries
  const { data: dailyCollection, isLoading: loadingDaily } =
    trpc.payment.getDailyCollection.useQuery(
      {},
      { refetchInterval: 60000, enabled: !!!user }
    );

  const { data: recentTransactions, isLoading: loadingRecent } =
    trpc.payment.getRecentTransactions.useQuery(
      {
        limit: 10,
      },
      { refetchInterval: 60000, enabled: !!!user }
    );

  const { data: cashRegister } = trpc.payment.getCashRegisterSummary.useQuery(
    {},
    { refetchInterval: 60000, enabled: !!!user }
  );

  // Mutations
  const syncOfflineMutation =
    trpc.payment.syncOfflineTransactions.useMutation();

  // Load offline transactions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("offlineTransactions");
    if (stored) {
      setOfflineTransactions(JSON.parse(stored));
    }
  }, []);

  // Sync offline transactions when coming back online
  useEffect(() => {
    if (serverOnline && offlineTransactions.length > 0) {
      handleSyncOfflineTransactions();
    }
  }, [serverOnline]);

  const handleSyncOfflineTransactions = async () => {
    console.log("Syncing offline transactions:", offlineTransactions);
    if (offlineTransactions.length === 0) return;

    try {
      const result = await syncOfflineMutation.mutateAsync({
        transactions: offlineTransactions,
      });

      toast.success(result.message);

      // Clear offline transactions
      setOfflineTransactions([]);
      localStorage.removeItem("offlineTransactions");

      // Refresh data
      await utils.payment.invalidate();
    } catch (error) {
      toast.error("Failed to sync offline transactions");
    }
  };

  if (loadingDaily || loadingRecent || isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <StatusIndicator />
          {offlineTransactions.length > 0 && (
            <Button
              onClick={handleSyncOfflineTransactions}
              disabled={!userOnline || syncOfflineMutation.isPending}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  syncOfflineMutation.isPending ? "animate-spin" : ""
                }`}
              />
              <span>Sync ({offlineTransactions.length})</span>
            </Button>
          )}
        </div>
      </div>

      {/* Daily Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Today's Collection"
          value={`${formatCurrency(dailyCollection?.totalAmount || 0)}`}
          icon={DollarSign}
          iconColor="text-green-500"
          description={`${
            dailyCollection?.transactionCount || 0
          } transactions today`}
        />

        <StatCard
          title="Pending Offline"
          value={`${offlineTransactions.length} transactions`}
          icon={AlertCircle}
          iconColor="text-yellow-600"
          description={`${offlineTransactions.length} transactions waiting to sync`}
        />
      </div>

      {/* Main Action Section */}
      <div className="flex justify-center gap-4 flex-wrap">
        <PaymentDepositCard
          offlineTransactions={offlineTransactions}
          setOfflineTransactions={setOfflineTransactions}
          isOnline={userOnline}
        />

        {/* Recent Transactions */}
        <RecentTransactions
          userId={user?.id || ""}
          limit={5}
          paymentStaff={true}
        />
      </div>

      {/* Offline Transactions Queue */}
      {offlineTransactions.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              <span>Offline Transactions Queue</span>
            </CardTitle>
            <CardDescription className="text-yellow-700">
              These transactions were saved offline and will sync automatically
              when connection is restored
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {offlineTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-2 bg-white rounded border"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div>
                      <span className="font-mono text-sm">
                        {transaction.cin}
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {formatDate(transaction.timestamp)}
                      </span>
                    </div>
                  </div>
                  <div className="font-medium">
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
            {serverOnline && (
              <Button
                onClick={handleSyncOfflineTransactions}
                disabled={syncOfflineMutation.isPending}
                className="w-full mt-4"
              >
                {syncOfflineMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Sync All Offline Transactions
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant="outline"
          className="h-16"
          onClick={() => (window.location.href = "/dashboard/payment/checkout")}
        >
          <Users className="h-6 w-6 mr-2" />
          Student Lookup
        </Button>

        <Button
          variant="outline"
          className="h-16"
          onClick={() => (window.location.href = "/dashboard/payment/report")}
        >
          <DollarSign className="h-6 w-6 mr-2" />
          Daily Report
        </Button>

        <Button
          variant="outline"
          className="h-16"
          onClick={() =>
            (window.location.href = "/dashboard/payment/cash-register")
          }
        >
          <Wallet className="h-6 w-6 mr-2" />
          Cash Register
        </Button>
      </div>
    </div>
  );
};

// Export with role-based access control
export const PaymentStaffDashboard = withDashboardLayout(
  PaymentStaffDashboardComponent,
  {
    requiredRole: RoleEnum.paymentStaff,
  }
);
