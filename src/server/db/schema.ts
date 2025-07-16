import { pgTable, text, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Enums
export const roleEnum = pgEnum('role', ['student', 'paymentStaff', 'verificationStaff', 'admin']);
export const mealTimeEnum = pgEnum('meal_time', ['breakfast', 'lunch', 'dinner']);
export const transactionTypeEnum = pgEnum('transaction_type', ['purchase', 'refund', 'meal_redemption']);

// Users table
export const users = pgTable('users', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  cin: text('cin').unique().notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').unique(),
  role: roleEnum('role').notNull().default('student'),
  mealBalance: integer('meal_balance').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Meal schedules table
export const mealSchedules = pgTable('meal_schedules', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  mealTime: mealTimeEnum('meal_time').notNull(),
  scheduledDate: timestamp('scheduled_date').notNull(),
  isRedeemed: boolean('is_redeemed').notNull().default(false),
  redeemedAt: timestamp('redeemed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable('transactions', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  type: transactionTypeEnum('type').notNull(),
  amount: integer('amount').notNull(),
  description: text('description'),
  processedBy: text('processed_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Sessions table (for offline sync)
export const sessions = pgTable('sessions', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  deviceId: text('device_id').notNull(),
  lastSync: timestamp('last_sync').defaultNow().notNull(),
  syncData: text('sync_data'), // JSON string for offline data
});