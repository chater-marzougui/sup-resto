"use client";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Filter,
  RefreshCw,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { StatCard } from "@/components/elements/stat-card";
import { formatCurrency, formatDate } from "@/lib/utils/main-utils";

const formatDateTime = (date: Date | string) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date(date));
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "";

  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}:${get("second")}`;
};

const DailyReportPageComponent = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);

  // Calculate offset for pagination
  const offset = (currentPage - 1) * limit;

  // tRPC query for daily report
  const {
    data: reportData,
    isLoading,
    refetch,
  } = trpc.payment.getDailyReport.useQuery({
    date: new Date(selectedDate),
    minAmount: minAmount ? parseInt(minAmount) : undefined,
    maxAmount: maxAmount ? parseInt(maxAmount) : undefined,
    limit,
    offset,
  });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleFilterChange = () => {
    setCurrentPage(1); // Reset to first page when filters change
    refetch();
  };

  const clearFilters = () => {
    setMinAmount("");
    setMaxAmount("");
    setCurrentPage(1);
    refetch();
  };

  const exportReport = () => {
    if (!reportData || !reportData.transactions.length) {
      toast.error("No data to export");
      return;
    }

    // Create CSV content
    const headers = [
      "Time",
      "Student Name",
      "CIN",
      "Amount (millimes)",
      "Processed By",
    ];
    const csvContent = [
      headers.join(","),
      ...reportData.transactions.map((transaction) =>
        [
          formatDateTime(transaction.createdAt),
          `"${transaction.user.firstName} ${transaction.user.lastName}"`,
          `'${transaction.user.cin}'`,
          transaction.amount,
          `"${transaction.processedByUser.firstName} ${transaction.processedByUser.lastName}"`,
        ].join(",")
      ),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-report-${selectedDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Report exported successfully");
  };

  // Calculate summary statistics
  const totalAmount =
    reportData?.transactions.reduce((sum, t) => sum + t.amount, 0) || 0;
  const transactionCount = reportData?.transactions.length || 0;

  return (
    <div className="space-y-6 px-16 py-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Date"
          icon={Calendar}
          value={formatDate(selectedDate)}
          iconColor="text-blue-500"
        />

        <StatCard
          title="Total Amount"
          icon={DollarSign}
          value={formatCurrency(totalAmount)}
          iconColor="text-green-500"
        />

        <StatCard
          title="Transactions"
          value={transactionCount}
          icon={Users}
          iconColor="text-blue-500"
          description={`Showing ${reportData?.transactions.length || 0} of ${
            reportData?.totalCount || 0
          }`}
        />
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Report Filters</span>
          </CardTitle>
          <CardDescription>
            Filter transactions by date and amount range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minAmount">Min Amount (millimes)</Label>
              <Input
                id="minAmount"
                type="number"
                placeholder="e.g., 1000"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAmount">Max Amount (millimes)</Label>
              <Input
                id="maxAmount"
                type="number"
                placeholder="e.g., 20000"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                min="0"
              />
            </div>

            <div className="flex items-end space-x-2">
              <Button onClick={handleFilterChange} className="flex-1">
                Apply Filters
              </Button>
              <Button onClick={clearFilters} variant="outline">
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Transaction Details</span>
            </div>
            {isLoading && (
              <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
            )}
            <Button
              onClick={exportReport}
              disabled={!reportData || !reportData.transactions.length}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">
                Loading transactions...
              </span>
            </div>
          ) : reportData && reportData.transactions.length > 0 ? (
            <div className="space-y-4">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Time</th>
                      <th className="text-left p-3 font-medium">Student</th>
                      <th className="text-left p-3 font-medium">CIN</th>
                      <th className="text-right p-3 font-medium">Amount</th>
                      <th className="text-left p-3 font-medium">
                        Processed By
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="font-mono text-sm">
                              {formatDate(transaction.createdAt)}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">
                            {transaction.user.firstName}{" "}
                            {transaction.user.lastName}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {transaction.user.cin}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="font-bold text-green-600">
                            +{formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-gray-600">
                            {transaction.processedByUser.firstName}{" "}
                            {transaction.processedByUser.lastName}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {reportData.transactions.map((transaction) => (
                  <Card
                    key={transaction.id}
                    className="border-l-4 border-l-green-500"
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">
                            {transaction.user.firstName}{" "}
                            {transaction.user.lastName}
                          </div>
                          <div className="text-sm text-gray-600 font-mono">
                            {transaction.user.cin}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            +{formatCurrency(transaction.amount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(transaction.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Processed by:
                        {transaction.processedByUser.firstName}{" "}
                        {transaction.processedByUser.lastName}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {reportData.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Page {reportData.currentPage} of {reportData.totalPages}(
                    {reportData.totalCount} total transactions)
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(reportData.totalPages, prev + 1)
                        )
                      }
                      disabled={currentPage === reportData.totalPages}
                      variant="outline"
                      size="sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">
                No Transactions Found
              </h3>
              <p className="text-sm">
                No transactions found for {formatDate(selectedDate)}
                {(minAmount || maxAmount) &&
                  " with the specified amount filters"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyReportPageComponent;
