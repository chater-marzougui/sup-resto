"use client";

import React from "react";
import {
  CreditCard,
  Calendar,
  Clock,
  QrCode,
  Plus,
  Settings,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { withDashboardLayout } from "./withDashboardLayout";
import { DashboardLayout } from "../layouts/dashboardLayout";
import { MealType, RoleEnum } from "@/server/db/enums";
import { StatCard } from "@/components/elements/stat-card";
import { WeeklyMealCalendar } from "./ui/weekly-meal-calendar";
import { RecentTransactions } from "./ui/recent-transactions";
import { DayMealsCard } from "./ui/day-meals-card";
import { QRCodeCard } from "./ui/qr-code-card";
import { LowBalanceAlert } from "./ui/low-balance-alert";
import { useProfile } from "@/hooks/use-profile";
import { MealCosts } from "@/config/global-config";
import LoadingSpinner from "../elements/LoadingSpinner";
import { formatCurrency } from "@/lib/utils/main-utils";
import { trpc } from "@/lib/trpc";
import { mealTimeEnum } from "@/config/global-config";

interface StudentDashboardProps {}

const StudentDashboardComponent: React.FC<StudentDashboardProps> = () => {
  // TODO: Replace with actual tRPC calls
  // const { data: userProfile } = api.users.getProfile.useQuery();
  // const { data: userBalance } = api.users.getBalance.useQuery();
  // const { data: monthlyStats } = api.analytics.getMonthlyStats.useQuery();
  // const scheduleMeal = api.mealSchedules.schedule.useMutation();
  // const cancelMeal = api.mealSchedules.cancel.useMutation();
  const { user, transactions, isLoadingUser, isLoadingTransactions } =
    useProfile();
  const todayMeals = trpc.meal.getDayMeals.useQuery({
    userId: user?.id,
    isToday: true,
  });
  const tomorrowMeals = trpc.meal.getDayMeals.useQuery({
    userId: user?.id,
    isToday: false,
  });
  const weeklyMeals = trpc.meal.getWeekMeals.useQuery(
    { userId: user?.id },
  );
  const cancelMeal = trpc.meal.cancelMeal.useMutation();
  const scheduleMeal = trpc.meal.scheduleMeal.useMutation();
  const monthlyStats = trpc.analytics.getMonthlySpending.useQuery({
    userId: user?.id,
  });

  if (isLoadingUser || isLoadingTransactions) {
    return <LoadingSpinner />;
  }

  if (!user || !transactions) {
    return <div>Error loading user data</div>;
  }

  const mealPrice = MealCosts[user.role];

  // Mock data - replace with actual data from tRPC
  const mockData = {
    weeklyMeals: [
      {
        id: "w1",
        date: "2024-01-15",
        mealTime: "lunch" as const,
        status: "scheduled" as const,
      },
    ],
    scheduledMealsThisWeek: 3,
  };

  const handleScheduleMeal = async (mealTime: MealType, scheduledDate: Date) => {
    if (!user?.id) return;
    if (mealTime == "lunch") {
      scheduledDate.setHours(...mealTimeEnum[0]); 
    } else {
      scheduledDate.setHours(...mealTimeEnum[1]); 
    }

    await scheduleMeal.mutateAsync({
      userId: user.id,
      mealTime: mealTime,
      scheduledDate: scheduledDate,
    });
    console.log("Scheduling meal:", mealTime);
  };

  const handleCancelMeal = async (mealId: string) => {
    const result = await cancelMeal.mutateAsync({
      userId: user.id,
      mealId: mealId,
    });
  };

  return (
    <DashboardLayout
      title="Student Dashboard"
      subtitle={`Welcome back, ${user?.firstName}!`}
      actions={
        <>
          <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Schedule Meals</span>
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Low Balance Alert */}
        <LowBalanceAlert
          currentBalance={user?.balance}
          mealPrice={mealPrice}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Current Balance"
            value={`${formatCurrency(user?.balance)}`}
            icon={CreditCard}
            iconColor="text-blue-500"
            description={`≈ ${Math.floor(user?.balance / mealPrice)} meals`}
          />

          <StatCard
            title="This Week"
            value={`${weeklyMeals.data?.length ?? 0} meals`}
            icon={Calendar}
            iconColor="text-green-500"
            description="Scheduled meals"
          />

          <StatCard
            title="Monthly Spending"
            value={`${formatCurrency(monthlyStats.data?.monthlySpending[0]?.month ?? 0)}`}
            icon={Clock}
            iconColor="text-yellow-500"
            description="January 2024"
          />

          <StatCard
            title="QR Ready"
            value="Active"
            icon={QrCode}
            iconColor="text-purple-500"
            description="Scan to enter"
          />
        </div>

        {/* Main Content Grid */}
        <div className="flex gap-6 items-center justify-between flex-col">
          <div className="flex flex-wrap items-center gap-6 w-full justify-between">
            <DayMealsCard
              userId={user?.id}
              isToday={true}
              meals={todayMeals.data || []}
              onScheduleMeal={handleScheduleMeal}
              onCancelMeal={handleCancelMeal}
            />

            <DayMealsCard
              userId={user?.id}
              isToday={false}
              meals={tomorrowMeals.data || []}
              onScheduleMeal={handleScheduleMeal}
              onCancelMeal={handleCancelMeal}
            />

            <QRCodeCard
              cin={user?.cin}
              userName={`${user?.firstName} ${user?.lastName}`}
            />
          </div>

          {/* Right Column - Weekly Calendar */}
          <div className="lg:col-span-2">
            <WeeklyMealCalendar meals={mockData.weeklyMeals} />
          </div>
        </div>

        {/* Recent Transactions */}
        <RecentTransactions transactions={transactions} />
      </div>
    </DashboardLayout>
  );
};

export const StudentDashboard = withDashboardLayout(StudentDashboardComponent, {
  requiredRole: RoleEnum.student,
});
