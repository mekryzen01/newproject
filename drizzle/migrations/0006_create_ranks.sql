CREATE TABLE "ranks" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_novice" boolean DEFAULT false NOT NULL,
	"person_type" text DEFAULT 'monk' NOT NULL,
	"order" integer NOT NULL
);
