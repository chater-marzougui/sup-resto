CREATE TYPE "public"."meal_time" AS ENUM('lunch', 'dinner');--> statement-breakpoint
CREATE TYPE "public"."schedule_status" AS ENUM('scheduled', 'refunded', 'cancelled', 'redeemed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('purchase', 'refund', 'meal_redemption', 'balance_adjustment');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'payment_staff', 'verification_staff', 'student', 'teacher', 'normal_user');--> statement-breakpoint
CREATE TABLE "meal_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"meal_time" "meal_time" NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"schedule_status" "schedule_status" DEFAULT 'scheduled' NOT NULL,
	"status_history" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_date_meal_unique" UNIQUE("user_id","scheduled_date","meal_time")
);
--> statement-breakpoint
CREATE TABLE "sync_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"sync_type" text NOT NULL,
	"success" boolean NOT NULL,
	"error_message" text,
	"records_affected" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"processed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"cin" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"password" text NOT NULL,
	"role" integer DEFAULT 5 NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_cin_unique" UNIQUE("cin"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "meal_schedules" ADD CONSTRAINT "meal_schedules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meal_schedules_user_id_idx" ON "meal_schedules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "meal_schedules_scheduled_date_idx" ON "meal_schedules" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "meal_schedules_status_idx" ON "meal_schedules" USING btree ("schedule_status");--> statement-breakpoint
CREATE INDEX "sync_logs_user_id_idx" ON "sync_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sync_logs_created_at_idx" ON "sync_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sync_logs_sync_type_idx" ON "sync_logs" USING btree ("sync_type");--> statement-breakpoint
CREATE INDEX "transactions_user_id_idx" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_type_idx" ON "transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "transactions_created_at_idx" ON "transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "transactions_processed_by_idx" ON "transactions" USING btree ("processed_by");--> statement-breakpoint
CREATE INDEX "cin_idx" ON "users" USING btree ("cin");--> statement-breakpoint
CREATE INDEX "email_idx" ON "users" USING btree ("email");