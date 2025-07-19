import { pgEnum } from "drizzle-orm/pg-core";

export const RoleEnum = {
    admin: 0,
    paymentStaff: 1,
    verificationStaff: 2,
    student: 3,
    teacher: 4,
    normalUser: 5,
    0: "admin",
    1: "payment_staff",
    2: "verification_staff",
    3: "student",
    4: "teacher",
    5: "normal_user",
};

export const userRoleEnum = pgEnum(
    "role",
    Object.values(RoleEnum).filter((value) => typeof value === "string") as [string, ...string[]]
);

export const mealTypeEnum = pgEnum('meal_time', ['lunch', 'dinner']);
export const transactionTypeEnum = pgEnum('transaction_type', ['purchase', 'refund', 'meal_redemption', 'balance_adjustment']);
export const scheduleStatusEnum = pgEnum('schedule_status', ['scheduled', 'refunded', 'cancelled', 'redeemed', 'expired']);