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
