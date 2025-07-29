import {
  RoleEnum,
  TransactionType,
} from "@/server/db/enums";

export function getRoleNameByNumber(key: number) {
  const values = Object.values(RoleEnum).filter(
    (value) => typeof value === "string"
  );
  return values[key];
}

export const getRoleColor = (role: number): string => {
  const colors: Record<number, string> = {
    0: "bg-red-100 text-red-800",
    1: "bg-blue-100 text-blue-800",
    2: "bg-green-100 text-green-800",
    3: "bg-purple-100 text-purple-800",
    4: "bg-yellow-100 text-yellow-800",
    5: "bg-gray-100 text-gray-800",
  };
  return colors[role] || "bg-gray-100 text-gray-800";
};

export const getTransactionColor = (type: TransactionType): string => {
  const colors: Record<string, string> = {
    balance_recharge: "text-blue-600",
    meal_schedule: "text-green-600",
    meal_redemption: "text-green-600",
    balance_adjustment: "text-purple-600",
    refund: "text-green-600",
  };
  return colors[type] || "text-gray-600";
};

export const formatCurrency = (amount: number | string): string => {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${(numericAmount / 1000).toFixed(2)} TND`;
};

export const formatDate = (dateString: string | Date): string => {
  if (typeof dateString === "string") {
    dateString = new Date(dateString);
  }
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getDayMonthYear = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const getDayMonthNumber = (date: Date): number => {
  const day = date.getDate();
  const month = date.getMonth() + 1; // Months are 0-indexed
  return day + month * 100;
};