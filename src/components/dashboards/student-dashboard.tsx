"use client";

import React from 'react';
import { CreditCard, Calendar, Clock, QrCode, Plus, Settings, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { withDashboardLayout } from './withDashboardLayout';
import { DashboardLayout } from '../layouts/dashboardLayout';
import { RoleEnum } from '@/server/db/enums';
import { StatCard } from '@/components/elements/stat-card';
import { WeeklyMealCalendar } from './ui/weekly-meal-calendar';
import { RecentTransactions } from './ui/recent-transactions';
import { TodayMealsCard } from './ui/today-meals-card';
import { QRCodeCard } from './ui/qr-code-card';
import { LowBalanceAlert } from './ui/low-balance-alert';

interface StudentDashboardProps {}

const StudentDashboardComponent: React.FC<StudentDashboardProps> = () => {
  // TODO: Replace with actual tRPC calls
  // const { data: userProfile } = api.users.getProfile.useQuery();
  // const { data: userBalance } = api.users.getBalance.useQuery();
  // const { data: monthlyStats } = api.analytics.getMonthlyStats.useQuery();
  // const scheduleMeal = api.mealSchedules.schedule.useMutation();
  // const cancelMeal = api.mealSchedules.cancel.useMutation();

  // Mock data - replace with actual data from tRPC
  const mockData = {
    user: {
      cin: '12345678',
      firstName: 'Ahmed',
      lastName: 'Ben Ali',
      balance: 3.40 // TND
    },
    todayMeals: [
      { 
        mealTime: 'lunch' as const, 
        canSchedule: true, 
        canCancel: false 
      },
      { 
        id: 'meal-123',
        mealTime: 'dinner' as const, 
        status: 'scheduled' as const,
        canSchedule: false, 
        canCancel: true 
      }
    ],
    weeklyMeals: [
      {
        id: 'w1',
        date: '2024-01-15',
        mealTime: 'lunch' as const,
        status: 'scheduled' as const
      }
    ],
    recentTransactions: [
      {
        id: 't1',
        type: 'balance_recharge' as const,
        amount: '10.00',
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 't2',
        type: 'meal_schedule' as const,
        amount: '0.20',
        createdAt: '2024-01-15T12:00:00Z'
      }
    ],
    monthlySpending: 15.60,
    scheduledMealsThisWeek: 3,
    mealPrice: 0.20 // 200 millimes = 0.20 TND
  };

  const handleScheduleMeal = (mealTime: 'lunch' | 'dinner') => {
    // TODO: Implement meal scheduling
    // scheduleMeal.mutate({ mealTime, date: new Date().toISOString() });
    console.log('Scheduling meal:', mealTime);
  };

  const handleCancelMeal = (mealId: string) => {
    // TODO: Implement meal cancellation
    // cancelMeal.mutate({ mealId });
    console.log('Cancelling meal:', mealId);
  };

  const handleRechargeClick = () => {
    // TODO: Navigate to recharge page or open recharge modal
    console.log('Redirect to recharge page');
  };

  return (
    <DashboardLayout 
      title="Student Dashboard" 
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
          mealPrice={mockData.mealPrice}
          onRechargeClick={handleRechargeClick}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Current Balance"
            value={`${mockData.user.balance.toFixed(2)} TND`}
            icon={CreditCard}
            iconColor="text-blue-500"
            description={`≈ ${Math.floor(mockData.user.balance / mockData.mealPrice)} meals`}
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
            <TodayMealsCard
              meals={mockData.todayMeals}
              onScheduleMeal={handleScheduleMeal}
              onCancelMeal={handleCancelMeal}
            />
            
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

export const StudentDashboard = withDashboardLayout(StudentDashboardComponent, {
  requiredRole: RoleEnum.student
});