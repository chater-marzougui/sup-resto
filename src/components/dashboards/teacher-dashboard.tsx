// src/components/dashboards/teacher-dashboard.tsx
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
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { withDashboardLayout } from "./withDashboardLayout";
import { DashboardLayout } from "../layouts/dashboardLayout";
import { RoleEnum } from "@/server/db/enums";
import { StatCard } from "@/components/elements/stat-card";
import { WeeklyMealCalendar } from "./ui/weekly-meal-calendar";
import { RecentTransactions } from "./ui/recent-transactions";
import { DayMealsCard } from "./ui/day-meals-card";
import { QRCodeCard } from "./ui/qr-code-card";
import { LowBalanceAlert } from "./ui/low-balance-alert";
import { useProfile } from "@/hooks/use-profile";
import LoadingSpinner from "../elements/LoadingSpinner";

interface TeacherDashboardProps {}

const TeacherDashboardComponent: React.FC<TeacherDashboardProps> = () => {
  // TODO: Replace with actual tRPC calls
  // const { data: userProfile } = api.users.getProfile.useQuery();
  // const { data: userBalance } = api.users.getBalance.useQuery();
  // const { data: monthlyStats } = api.analytics.getMonthlyStats.useQuery();
  // const scheduleMeal = api.mealSchedules.schedule.useMutation();
  // const cancelMeal = api.mealSchedules.cancel.useMutation();
  const { user, isLoadingUser, isLoadingTransactions } = useProfile();
  if (isLoadingUser || isLoadingTransactions) {
    return <LoadingSpinner />;
  }

  // Mock data - replace with actual data from tRPC
  const mockData = {
    user: {
      cin: "87654321",
      firstName: "Prof. Sarah",
      lastName: "Mahmoud",
      balance: 25.4, // TND
    },
    todayMeals: [
      {
        mealTime: "lunch" as const,
        canSchedule: true,
        canCancel: false,
      },
      {
        id: "meal-456",
        mealTime: "dinner" as const,
        status: "scheduled" as const,
        canSchedule: false,
        canCancel: true,
      },
    ],
    weeklyMeals: [
      {
        id: "w2",
        date: "2024-01-15",
        mealTime: "lunch" as const,
        status: "scheduled" as const,
      },
    ],
    recentTransactions: [
      {
        id: "t3",
        type: "balance_recharge" as const,
        amount: "30.00",
        createdAt: "2024-01-15T10:00:00Z",
      },
      {
        id: "t4",
        type: "meal_schedule" as const,
        amount: "2.00",
        createdAt: "2024-01-15T12:00:00Z",
      },
    ],
    monthlySpending: 45.2,
    scheduledMealsThisWeek: 4,
    teacherMealPrice: 2.0, // 2000 millimes = 2.00 TND
    studentMealPrice: 0.2, // When eating with students
    hasStudentPricing: false, // Toggle for eating with students
  };

  const [eatWithStudents, setEatWithStudents] = React.useState(
    mockData.hasStudentPricing
  );
  const currentMealPrice = eatWithStudents
    ? mockData.studentMealPrice
    : mockData.teacherMealPrice;

  const handleScheduleMeal = (mealTime: "lunch" | "dinner") => {
    // TODO: Implement meal scheduling with pricing option
    // scheduleMeal.mutate({ mealTime, date: new Date().toISOString(), useStudentPricing: eatWithStudents });
    console.log(
      "Scheduling meal:",
      mealTime,
      "with student pricing:",
      eatWithStudents
    );
  };

  const handleCancelMeal = (mealId: string) => {
    // TODO: Implement meal cancellation
    // cancelMeal.mutate({ mealId });
    console.log("Cancelling meal:", mealId);
  };

  const handleRechargeClick = () => {
    // TODO: Navigate to recharge page or open recharge modal
    console.log("Redirect to recharge page");
  };

  return (
    <DashboardLayout
      title="Teacher Dashboard"
      subtitle={`Welcome back, ${mockData.user.firstName}!`}
      actions={
        <>
          <Button variant="outline" className="flex items-center space-x-2">
            <History className="h-4 w-4" />
            <span>History</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Recharge</span>
          </Button>
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
          currentBalance={mockData.user.balance}
          mealPrice={currentMealPrice}
          onRechargeClick={handleRechargeClick}
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
                    ? `${mockData.studentMealPrice.toFixed(
                        2
                      )} TND per meal (eating with students)`
                    : `${mockData.teacherMealPrice.toFixed(
                        2
                      )} TND per meal (regular teacher pricing)`}
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
            value={`${mockData.user.balance.toFixed(2)} TND`}
            icon={CreditCard}
            iconColor="text-blue-500"
            description={`≈ ${Math.floor(
              mockData.user.balance / currentMealPrice
            )} meals at current rate`}
          />

          <StatCard
            title="This Week"
            value={mockData.scheduledMealsThisWeek}
            icon={Calendar}
            iconColor="text-green-500"
            description="Scheduled meals"
          />

          <StatCard
            title="Monthly Spending"
            value={`${mockData.monthlySpending.toFixed(2)} TND`}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Today's Meals & QR */}
          <div className="space-y-6">
            <div className="relative">
              {/* <DayMealsCard
                userId={mockData.user.id}
                isToday={true}
                meals={mockData.todayMeals}
                onScheduleMeal={handleScheduleMeal} 
                onCancelMeal={handleCancelMeal}
              /> */}
              {eatWithStudents && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    Student Rate
                  </Badge>
                </div>
              )}
            </div>

            <QRCodeCard
              cin={mockData.user.cin}
              userName={`${mockData.user.firstName} ${mockData.user.lastName}`}
            />
          </div>

          {/* Right Column - Weekly Calendar */}
          <div className="lg:col-span-2">
            <WeeklyMealCalendar meals={mockData.weeklyMeals} />
          </div>
        </div>

        {/* Recent Transactions */}
        <RecentTransactions transactions={mockData.recentTransactions} />
      </div>
    </DashboardLayout>
  );
};

export const TeacherDashboard = withDashboardLayout(TeacherDashboardComponent, {
  requiredRole: RoleEnum.teacher,
});
