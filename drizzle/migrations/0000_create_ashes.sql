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
-- Row Level Security
ALTER TABLE "ashes" ENABLE ROW LEVEL SECURITY;