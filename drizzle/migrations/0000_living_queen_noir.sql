CREATE TABLE "ashes" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"deceased_name" text NOT NULL,
	"death_date" text NOT NULL,
	"niche_code" text NOT NULL,
	"relative_name" text NOT NULL,
	"relative_phone" text NOT NULL,
	"deposit_date" text NOT NULL,
	"deposited_by" text NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "borrow_records" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"item_id" varchar(256) NOT NULL,
	"item_name" text NOT NULL,
	"borrower_name" text NOT NULL,
	"borrower_phone" text NOT NULL,
	"borrow_qty" integer NOT NULL,
	"borrow_date" text NOT NULL,
	"due_date" text NOT NULL,
	"return_date" text,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"location" text NOT NULL,
	"host_name" text NOT NULL,
	"monks_needed" integer NOT NULL,
	"assigned_monks" jsonb NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"total_qty" integer NOT NULL,
	"available_qty" integer NOT NULL,
	"category" text NOT NULL,
	"condition" text NOT NULL,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"href" text NOT NULL,
	"icon_name" text NOT NULL,
	"is_active" boolean NOT NULL,
	"order" integer NOT NULL,
	"parent_id" varchar(256)
);
--> statement-breakpoint
CREATE TABLE "monks" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"chaya" text NOT NULL,
	"rank" text NOT NULL,
	"ordination_date" text NOT NULL,
	"phone" text NOT NULL,
	"status" text NOT NULL,
	"image_url" text,
	"father_name" text,
	"mother_name" text,
	"emergency_contact" text,
	"emergency_phone" text,
	"novice_ordination_date" text,
	"domicile_address" text
);
--> statement-breakpoint
CREATE TABLE "ranks" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_novice" boolean DEFAULT false NOT NULL,
	"person_type" text DEFAULT 'monk' NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" varchar(256) PRIMARY KEY DEFAULT 'config-1' NOT NULL,
	"temple_name" text NOT NULL,
	"abbr" text NOT NULL,
	"logo_icon" text NOT NULL,
	"theme_color" text NOT NULL,
	"logo_url" text
);
--> statement-breakpoint
CREATE TABLE "system_users" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"role" text NOT NULL,
	"phone" text,
	"password" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"category" text NOT NULL,
	"date" text NOT NULL,
	"description" text NOT NULL,
	"donor_name" text,
	"receipt_no" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text,
	"phone" varchar(256)
);
