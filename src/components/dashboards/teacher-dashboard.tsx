// src/components/dashboards/teacher-dashboard.tsx
"use client";

import React from "react";
import {
  CreditCard,
  Calendar,
  Clock,
  QrCode,
  Settings,
  History,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { withDashboardLayout } from "./withDashboardLayout";
import { DashboardLayout } from "../layouts/dashboardLayout";
import { RoleEnum } from "@/server/db/enums";
import { StatCard } from "@/components/elements/stat-card";
import { WeeklyMealCalendar } from "./ui/calendars/weekly-meal-calendar";
import { RecentTransactions } from "./ui/recent-transactions/recent-transactions";
import { DayMealsCard } from "./ui/day-meals-card";
import { QRCodeCard } from "./ui/qr-code-card";
import { LowBalanceAlert } from "./ui/low-balance-alert";
import { useProfile } from "@/hooks/use-profile";
import LoadingSpinner from "../elements/LoadingSpinner";
import { MealCosts } from "@/config/global-config";
import { trpc } from "@/lib/trpc";
import { mealTimeEnum } from "@/config/global-config";
import { toast } from "sonner";
import { MealType } from "@/server/db/enums";
import { formatCurrency } from "@/lib/utils/main-utils";

interface TeacherDashboardProps {}

const TeacherDashboardComponent: React.FC<TeacherDashboardProps> = () => {
  const { user, isLoadingUser } = useProfile();
  const [eatWithStudents, setEatWithStudents] = React.useState(false);
  const currentMealPrice = eatWithStudents
    ? MealCosts[RoleEnum.student]
    : MealCosts[RoleEnum.teacher];

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
    onSuccess: () => {
      utils.invalidate();
      toast.success("Meal cancelled successfully");
    },
    onError: (error) => {
      toast.error("Failed to cancel meal", { description: error.message });
    },
  });
  const scheduleMeal = trpc.meal.scheduleMeal.useMutation({
    onSuccess: () => {
      utils.invalidate();
      toast.success("Meal scheduled successfully");
    },
    onError: (error) => {
      toast.error("Failed to schedule meal", { description: error.message });
    },
  });
  const monthlyStats = trpc.analytics.getMonthlySpending.useQuery({
    userId: user?.id,
  });

  const utils = trpc.useUtils();

  if (isLoadingUser) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <div>Error loading user data</div>;
  }

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
      isTeacherDiscount: eatWithStudents,
    });
  };

  const handleCancelMeal = async (mealId: string) => {
    await cancelMeal.mutateAsync({
      userId: user.id,
      mealId: mealId,
    });
  };

  return (
    <DashboardLayout
      title="Teacher Dashboard"
      subtitle={`Welcome back, ${user.firstName}!`}
    >
      <div className="space-y-6">
        {/* Low Balance Alert */}
        <LowBalanceAlert
          currentBalance={user.balance}
          mealPrice={MealCosts[user.role]}
        />

        {/* Teacher-specific pricing card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Meal Pricing Options</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">
                  Current pricing:{" "}
                  {eatWithStudents ? "Student Rate" : "Teacher Rate"}
                </p>
                <p className="text-sm text-gray-600">
                  {eatWithStudents
                    ? `${formatCurrency(
                        MealCosts[RoleEnum.student]
                      )} per meal (eating with students)`
                    : `${formatCurrency(
                        MealCosts[RoleEnum.teacher]
                      )} per meal (regular teacher pricing)`}
                </p>
              </div>
              <Button
                variant={eatWithStudents ? "default" : "outline"}
                onClick={() => setEatWithStudents(!eatWithStudents)}
                className="flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>
                  {eatWithStudents
                    ? "Using Student Rate"
                    : "Switch to Student Rate"}
                </span>
              </Button>
            </div>
            {!eatWithStudents && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 <strong>Tip:</strong> Switch to student pricing when eating
                  with students to pay the same rate!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Current Balance"
            value={`${formatCurrency(user?.balance)}`}
            icon={CreditCard}
            iconColor="text-blue-500"
            description={`≈ ${Math.floor(
              user?.balance > 0 ? user?.balance / currentMealPrice : 0 
            )} meals at current rate`}
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
              userId={user.id}
              isLoading={todayMeals.isLoading}
              isPending={cancelMeal.isPending || scheduleMeal.isPending}
              isToday={true}
              meals={todayMeals.data || []}
              onScheduleMeal={handleScheduleMeal}
              onCancelMeal={handleCancelMeal}
            />
            <DayMealsCard
              userId={user.id}
              isLoading={tomorrowMeals.isLoading}
              isPending={cancelMeal.isPending || scheduleMeal.isPending}
              isToday={false}
              meals={tomorrowMeals.data || []}
              onScheduleMeal={handleScheduleMeal}
              onCancelMeal={handleCancelMeal}
            />

            {eatWithStudents && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  Student Rate
                </Badge>
              </div>
            )}

            <QRCodeCard
              cin={user.cin}
              userName={`${user.firstName} ${user.lastName}`}
            />
          </div>

          {/* Right Column - Weekly Calendar */}
          <div className="lg:col-span-2">
            <WeeklyMealCalendar meals={weeklyMeals.data || []} eatWithStudents={eatWithStudents} />
          </div>
        </div>

        {/* Recent Transactions */}
        <RecentTransactions userId={user?.id} />
      </div>
    </DashboardLayout>
  );
};

export const TeacherDashboard = withDashboardLayout(TeacherDashboardComponent, {
  requiredRole: RoleEnum.teacher,
});
