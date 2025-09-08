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
  Utensils,
  QrCode,
  Users,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Clock,
  Eye,
  UserCheck,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";
import { formatDate } from "@/lib/utils/main-utils";
import { StatCard } from "../elements/stat-card";
import { useOnlineStatus } from "@/hooks/use-Online";
import { StatusIndicator } from "../elements/isOnlineElement";
import { MealVerificationCard } from "./ui/meal-verification-card";

const VerificationStaffDashboardComponent = () => {
  const { user, isLoadingUser } = useProfile();
  const { userOnline, serverOnline } = useOnlineStatus();
  const [offlineVerifications, setOfflineVerifications] = useState<any[]>([]);
  const utils = trpc.useUtils();

  // tRPC queries
  const { data: verificationStats, isLoading: loadingStats } =
    trpc.verification.getVerificationStats.useQuery(
      { date: new Date() },
      { refetchInterval: 60000, enabled: !!user }
    );

  const { data: mealPeriodStatus, isLoading: loadingPeriod } =
    trpc.verification.getMealPeriodStatus.useQuery(
      { date: new Date() },
      { refetchInterval: 30000, enabled: !!user }
    );

  const { data: recentVerifications, isLoading: loadingRecent } =
    trpc.verification.getRecentVerifications.useQuery(
      { limit: 5 },
      { refetchInterval: 30000, enabled: !!user }
    );

  const { data: noShowStudents } =
    trpc.verification.getNoShowStudents.useQuery(
      { date: new Date() },
      { refetchInterval: 60000, enabled: !!user }
    );

  // Mutations
  const syncOfflineMutation =
    trpc.verification.syncOfflineVerifications.useMutation();

  // Load offline verifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("offlineVerifications");
    if (stored) {
      setOfflineVerifications(JSON.parse(stored));
    }
  }, []);

  // Sync offline verifications when coming back online
  useEffect(() => {
    if (serverOnline && offlineVerifications.length > 0) {
      handleSyncOfflineVerifications();
    }
  }, [serverOnline]);

  const handleSyncOfflineVerifications = async () => {
    if (offlineVerifications.length === 0) return;

    try {
      const result = await syncOfflineMutation.mutateAsync({
        verifications: offlineVerifications,
      });

      toast.success(result.message);

      // Clear offline verifications
      setOfflineVerifications([]);
      localStorage.removeItem("offlineVerifications");

      // Refresh data
      await utils.verification.invalidate();
    } catch (error) {
      toast.error("Failed to sync offline verifications");
    }
  };

  const getCurrentMealPeriod = () => {
    if (!mealPeriodStatus) return null;
    
    if (mealPeriodStatus.isLunchActive) {
      return {
        name: 'Lunch',
        period: 'lunch',
        active: true,
        window: mealPeriodStatus.lunchWindow,
      };
    } else if (mealPeriodStatus.isDinnerActive) {
      return {
        name: 'Dinner', 
        period: 'dinner',
        active: true,
        window: mealPeriodStatus.dinnerWindow,
      };
    }
    
    return {
      name: mealPeriodStatus.nextPeriod === 'lunch' ? 'Lunch' : 'Dinner',
      period: mealPeriodStatus.nextPeriod,
      active: false,
      window: mealPeriodStatus.nextPeriod === 'lunch' 
        ? mealPeriodStatus.lunchWindow 
        : mealPeriodStatus.dinnerWindow,
    };
  };

  const currentMealPeriod = getCurrentMealPeriod();

  if (loadingStats || loadingPeriod || loadingRecent || isLoadingUser) {
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
          {offlineVerifications.length > 0 && (
            <Button
              onClick={handleSyncOfflineVerifications}
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
              <span>Sync ({offlineVerifications.length})</span>
            </Button>
          )}
        </div>
      </div>

      {/* Current Meal Period Status */}
      <Card className={`border-2 ${
        currentMealPeriod?.active 
          ? 'border-green-500 bg-green-50' 
          : 'border-yellow-500 bg-yellow-50'
      }`}>
        <CardHeader>
          <CardTitle className={`flex items-center space-x-2 ${
            currentMealPeriod?.active ? 'text-green-700' : 'text-yellow-700'
          }`}>
            <Clock className="h-5 w-5" />
            <span>
              {currentMealPeriod?.active 
                ? `${currentMealPeriod.name} Period - ACTIVE`
                : `Next: ${currentMealPeriod?.name} Period`
              }
            </span>
          </CardTitle>
          <CardDescription className={
            currentMealPeriod?.active ? 'text-green-600' : 'text-yellow-600'
          }>
            {currentMealPeriod?.active 
              ? `Verification window: ${currentMealPeriod.window.start} - ${currentMealPeriod.window.end}`
              : `Opens at ${currentMealPeriod?.window.start}`
            }
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Daily Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Scheduled Today"
          value={`${verificationStats?.totalScheduled || 0}`}
          icon={Users}
          iconColor="text-blue-500"
          description="Total meals scheduled"
        />

        <StatCard
          title="Verified Today"
          value={`${verificationStats?.totalRedeemed || 0}`}
          icon={CheckCircle}
          iconColor="text-green-500"
          description={`${verificationStats?.redemptionRate || 0}% redemption rate`}
        />

        <StatCard
          title="My Verifications"
          value={`${verificationStats?.staffVerifications || 0}`}
          icon={UserCheck}
          iconColor="text-purple-500"
          description="Verified by me today"
        />

        <StatCard
          title="No Shows"
          value={`${verificationStats?.noShowCount || 0}`}
          icon={AlertTriangle}
          iconColor="text-red-500"
          description="Scheduled but not consumed"
        />
      </div>

      {/* Main Action Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Scanner Card */}
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-700">
              <QrCode className="h-6 w-6" />
              <span>Meal Verification Scanner</span>
            </CardTitle>
            <CardDescription>
              Scan student QR codes to verify meal consumption
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full h-16 text-lg"
              disabled={!currentMealPeriod?.active}
              onClick={() => window.location.href = '/dashboard/verification/scanner'}
            >
              <QrCode className="h-6 w-6 mr-2" />
              {currentMealPeriod?.active 
                ? `Scan for ${currentMealPeriod.name}`
                : 'Scanner Inactive'
              }
            </Button>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/dashboard/verification/manual'}
            >
              <Eye className="h-4 w-4 mr-2" />
              Manual Verification
            </Button>
          </CardContent>
        </Card>

        {/* Recent Verifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Recent Verifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentVerifications && recentVerifications.length > 0 ? (
                recentVerifications.map((verification) => (
                  <div
                    key={verification.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <span className="font-medium text-sm">
                          {verification.studentFirstName} {verification.studentLastName}
                        </span>
                        <div className="text-xs text-gray-600">
                          CIN: {verification.studentCin}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm capitalize">
                        {verification.mealTime}
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatDate(verification.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No verifications yet today
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offline Verifications Queue */}
      {offlineVerifications.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Offline Verifications Queue</span>
            </CardTitle>
            <CardDescription className="text-yellow-700">
              These verifications were saved offline and will sync automatically
              when connection is restored
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {offlineVerifications.map((verification) => (
                <div
                  key={verification.id}
                  className="flex items-center justify-between p-2 bg-white rounded border"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div>
                      <span className="font-mono text-sm">
                        {verification.cin}
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {formatDate(verification.timestamp)}
                      </span>
                    </div>
                  </div>
                  <div className="font-medium capitalize">
                    {verification.mealTime}
                  </div>
                </div>
              ))}
            </div>
            {serverOnline && (
              <Button
                onClick={handleSyncOfflineVerifications}
                disabled={syncOfflineMutation.isPending}
                className="w-full mt-4"
              >
                {syncOfflineMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Sync All Offline Verifications
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="h-16"
          onClick={() => (window.location.href = "/dashboard/verification/student-lookup")}
        >
          <Users className="h-6 w-6 mr-2" />
          Student Lookup
        </Button>

        <Button
          variant="outline"
          className="h-16"
          onClick={() => (window.location.href = "/dashboard/verification/report")}
        >
          <Eye className="h-6 w-6 mr-2" />
          Daily Report
        </Button>

        <Button
          variant="outline"
          className="h-16"
          onClick={() => (window.location.href = "/dashboard/verification/no-shows")}
        >
          <AlertTriangle className="h-6 w-6 mr-2" />
          No Shows ({noShowStudents?.count || 0})
        </Button>

        <Button
          variant="outline"
          className="h-16"
          onClick={() => (window.location.href = "/dashboard/verification/history")}
        >
          <Utensils className="h-6 w-6 mr-2" />
          Meal History
        </Button>
      </div>

      {/* No Show Alert */}
      {noShowStudents && noShowStudents.count > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span>No-Show Alert</span>
            </CardTitle>
            <CardDescription className="text-red-700">
              {noShowStudents.count} students scheduled meals but haven't consumed them yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => (window.location.href = "/dashboard/verification/no-shows")}
              className="w-full"
              variant="destructive"
            >
              View No-Show Students
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Meal Verification Quick Card */}
      <div className="flex justify-center">
        <MealVerificationCard
          offlineVerifications={offlineVerifications}
          setOfflineVerifications={setOfflineVerifications}
          isOnline={userOnline}
        />
      </div>
    </div>
  );
};

// Export with role-based access control
export const VerificationStaffDashboard = withDashboardLayout(
  VerificationStaffDashboardComponent,
  {
    requiredRole: RoleEnum.verificationStaff,
  }
);