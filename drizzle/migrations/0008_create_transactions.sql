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
