"use client";

import React from "react";
import { CreditCard, Calendar, Clock } from "lucide-react";
import { withDashboardLayout } from "./withDashboardLayout";
import { DashboardLayout } from "../layouts/dashboardLayout";
import { MealType, RoleEnum } from "@/server/db/enums";
import { StatCard } from "@/components/elements/stat-card";
import { WeeklyMealCalendar } from "./ui/calendars/weekly-meal-calendar";
import { RecentTransactions } from "./ui/recent-transactions/recent-transactions";
import { DayMealsCard } from "./ui/day-meals-card";
import { QRCodeCard } from "./ui/qr-code-card";
import { LowBalanceAlert } from "./ui/low-balance-alert";
import { useProfile } from "@/hooks/use-profile";
import { MealCosts } from "@/config/global-config";
import LoadingSpinner from "../elements/LoadingSpinner";
import { formatCurrency } from "@/lib/utils/main-utils";
import { trpc } from "@/lib/trpc";
import { mealTimeEnum } from "@/config/global-config";
import { toast } from "sonner";

interface StudentDashboardProps {}

const StudentDashboardComponent: React.FC<StudentDashboardProps> = () => {
  const { user, isLoadingUser } = useProfile();
  const utils = trpc.useUtils();

  const todayMeals = trpc.meal.getDayMeals.useQuery({
    userId: user?.id,
    isToday: true,
  });
  const tomorrowMeals = trpc.meal.getDayMeals.useQuery({
    userId: user?.id,
    isToday: false,
  });
  const weeklyMeals = trpc.meal.getWeekMeals.useQuery({ userId: user?.id });
  const cancelMeal = trpc.meal.cancelMeal.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      toast.success("Meal cancelled successfully");
    },
    onError: (error) => {
      toast.error("Failed to cancel meal", { description: error.message });
    },
  });
  const scheduleMeal = trpc.meal.scheduleMeal.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      toast.success("Meal scheduled successfully");
    },
    onError: (error) => {
      toast.error("Failed to schedule meal", { description: error.message });
    },
  });
  const monthlyStats = trpc.analytics.getMonthlySpending.useQuery({
    userId: user?.id,
  });

  if (isLoadingUser) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <div>Error loading user data</div>;
  }

  const mealPrice = MealCosts[user.role];

  const handleScheduleMeal = async (
    mealTime: MealType,
    scheduledDate: Date
  ) => {
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
  };

  const handleCancelMeal = async (mealId: string) => {
    await cancelMeal.mutateAsync({
      mealId: mealId,
      userId: user.id,
    });
  };

  return (
    <DashboardLayout
      title="Student Dashboard"
      subtitle={`Welcome back, ${user?.firstName}!`}
    >
      <div className="space-y-6">
        {/* Low Balance Alert */}
        <LowBalanceAlert currentBalance={user?.balance} mealPrice={mealPrice} />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Current Balance"
            value={`${formatCurrency(user?.balance)}`}
            icon={CreditCard}
            iconColor="text-blue-500"
            description={`≈ ${Math.floor(user?.balance > 0 ? user?.balance / mealPrice : 0)} meals`}
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
            value={`${formatCurrency(
              monthlyStats.data?.monthlySpending[0]?.month ?? 0
            )}`}
            icon={Clock}
            iconColor="text-yellow-500"
            description="January 2024"
          />
        </div>

        {/* Main Content Grid */}
        <div className="flex gap-6 items-center justify-between flex-col">
          <div className="flex flex-wrap items-center gap-6 w-full justify-between">
            <DayMealsCard
              userId={user?.id}
              isToday={true}
              meals={todayMeals.data || []}
              isLoading={todayMeals.isLoading}
              isPending={cancelMeal.isPending || scheduleMeal.isPending || todayMeals.isPending}
              onScheduleMeal={handleScheduleMeal}
              onCancelMeal={handleCancelMeal}
            />

            <DayMealsCard
              userId={user?.id}
              isToday={false}
              isLoading={tomorrowMeals.isLoading}
              isPending={cancelMeal.isPending || scheduleMeal.isPending || tomorrowMeals.isPending}
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
            <WeeklyMealCalendar meals={weeklyMeals.data || []} />
          </div>
        </div>

        <RecentTransactions userId={user?.id} />
      </div>
    </DashboardLayout>
  );
};

export const StudentDashboard = withDashboardLayout(StudentDashboardComponent, {
  requiredRole: RoleEnum.student,
});
