CREATE TABLE "menu_items" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"href" text NOT NULL,
	"icon_name" text NOT NULL,
	"is_active" boolean NOT NULL,
	"order" integer NOT NULL,
	"parent_id" varchar(256)
);
