import { pgTable, text, timestamp, integer, boolean, pgEnum, decimal, index, unique, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { mealTypeEnum, scheduleStatusEnum, transactionTypeEnum, userRoleEnum } from './enums';

/*
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
*/

// Type definitions for JSON fields
export type StatusHistoryEntry = {
  status: typeof scheduleStatusEnum.enumValues[number];
  timestamp: string;
};

// Users table
export const users = pgTable('users', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  cin: text('cin').unique().notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').unique(),
  password: text('password').notNull(),
  role: integer('role').notNull().default(5), // Default to 'normalUser'
  balance: integer('balance').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ([
  index('cin_idx').on(table.cin),
  index('email_idx').on(table.email),
]));

// Meal schedules table
export const mealSchedules = pgTable('meal_schedules', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  mealTime: mealTypeEnum('meal_time').notNull(),
  scheduledDate: timestamp('scheduled_date').notNull(),
  status: scheduleStatusEnum('schedule_status').notNull().default('scheduled'),
  statusHistory: jsonb('status_history').$type<StatusHistoryEntry[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ([
  unique('user_date_meal_unique').on(table.userId, table.scheduledDate, table.mealTime),
  index('meal_schedules_user_id_idx').on(table.userId),
  index('meal_schedules_scheduled_date_idx').on(table.scheduledDate),
  index('meal_schedules_status_idx').on(table.status),
]));

// Transactions table
export const transactions = pgTable('transactions', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: transactionTypeEnum('type').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(), // Changed to decimal for financial accuracy
  processedBy: text('processed_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ([
  index('transactions_user_id_idx').on(table.userId),
  index('transactions_type_idx').on(table.type),
  index('transactions_created_at_idx').on(table.createdAt),
  index('transactions_processed_by_idx').on(table.processedBy),
]));

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull()
});

// Offline sync logs
export const syncLogs = pgTable('sync_logs', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  syncType: text('sync_type').notNull(), // 'full', 'incremental', 'push'
  success: boolean('success').notNull(),
  errorMessage: text('error_message'),
  recordsAffected: integer('records_affected'), // Number of records synced
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ([
  index('sync_logs_user_id_idx').on(table.userId),
  index('sync_logs_created_at_idx').on(table.createdAt),
  index('sync_logs_sync_type_idx').on(table.syncType),
]));

// Fixed Relations - Properly disambiguated
export const usersRelations = relations(users, ({ many }) => ({
  mealSchedules: many(mealSchedules),
  // Transactions created by this user
  userTransactions: many(transactions, {
    relationName: 'userTransactions',
  }),
  // Transactions processed by this user
  processedTransactions: many(transactions, {
    relationName: 'processedTransactions',
  }),
  syncLogs: many(syncLogs),
}));

export const mealSchedulesRelations = relations(mealSchedules, ({ one }) => ({
  user: one(users, {
    fields: [mealSchedules.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  // User who owns this transaction
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
    relationName: 'userTransactions',
  }),
  // User who processed this transaction
  processedByUser: one(users, {
    fields: [transactions.processedBy],
    references: [users.id],
    relationName: 'processedTransactions',
  }),
}));

export const syncLogsRelations = relations(syncLogs, ({ one }) => ({
  user: one(users, {
    fields: [syncLogs.userId],
    references: [users.id],
  }),
}));
