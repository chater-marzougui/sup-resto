ALTER TABLE "meal_schedules" RENAME COLUMN "status" TO "schedule_status";--> statement-breakpoint
DROP INDEX "meal_schedules_status_idx";--> statement-breakpoint
CREATE INDEX "meal_schedules_status_idx" ON "meal_schedules" USING btree ("schedule_status");