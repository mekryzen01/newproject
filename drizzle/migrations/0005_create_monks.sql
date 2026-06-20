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
