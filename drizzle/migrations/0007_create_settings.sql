CREATE TABLE "settings" (
	"id" varchar(256) PRIMARY KEY DEFAULT 'config-1' NOT NULL,
	"temple_name" text NOT NULL,
	"abbr" text NOT NULL,
	"logo_icon" text NOT NULL,
	"theme_color" text NOT NULL,
	"logo_url" text
);
