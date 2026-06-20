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
