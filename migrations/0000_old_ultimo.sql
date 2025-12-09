CREATE TABLE "fashion_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"image_url" text NOT NULL,
	"description" text,
	"user_id" varchar,
	"is_shared" text DEFAULT 'false' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"live_key" varchar(64) NOT NULL,
	"test_key" varchar(64) NOT NULL,
	"allowed_domains" jsonb DEFAULT '[]'::jsonb,
	"plan" varchar(50) DEFAULT 'free',
	"monthly_quota" integer DEFAULT 100,
	"quota_used" integer DEFAULT 0,
	"quota_reset_at" timestamp,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"webhook_url" varchar(500),
	"webhook_secret" varchar(64),
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "merchants_email_unique" UNIQUE("email"),
	CONSTRAINT "merchants_live_key_unique" UNIQUE("live_key"),
	CONSTRAINT "merchants_test_key_unique" UNIQUE("test_key")
);
--> statement-breakpoint
CREATE TABLE "try_on_results" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"model_image_url" text NOT NULL,
	"fashion_image_url" text NOT NULL,
	"result_image_url" text NOT NULL,
	"fashion_item_name" text NOT NULL,
	"fashion_category" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"is_verified" text DEFAULT 'false' NOT NULL,
	"verification_token" text,
	"verification_token_expires" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "widget_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" integer,
	"session_id" varchar(64),
	"event_type" varchar(50) NOT NULL,
	"event_data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "widget_sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"merchant_id" integer,
	"product_image" varchar(2000) NOT NULL,
	"product_name" varchar(255),
	"product_id" varchar(255),
	"product_category" varchar(50),
	"product_price" numeric(10, 2),
	"product_currency" varchar(3),
	"product_url" varchar(1000),
	"external_user_id" varchar(255),
	"user_image" varchar(2000),
	"status" varchar(20) DEFAULT 'pending',
	"result_image" varchar(2000),
	"result_thumbnail" varchar(2000),
	"processing_time" integer,
	"error_code" varchar(50),
	"error_message" text,
	"origin_domain" varchar(255),
	"user_agent" text,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"expires_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "fashion_items" ADD CONSTRAINT "fashion_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "try_on_results" ADD CONSTRAINT "try_on_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widget_analytics" ADD CONSTRAINT "widget_analytics_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widget_analytics" ADD CONSTRAINT "widget_analytics_session_id_widget_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."widget_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widget_sessions" ADD CONSTRAINT "widget_sessions_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;