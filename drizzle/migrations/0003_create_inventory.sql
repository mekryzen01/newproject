CREATE TABLE "inventory" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"total_qty" integer NOT NULL,
	"available_qty" integer NOT NULL,
	"category" text NOT NULL,
	"condition" text NOT NULL,
	"image_url" text
);
