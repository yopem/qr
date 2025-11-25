CREATE TYPE "public"."qr_type" AS ENUM('static', 'dynamic');--> statement-breakpoint
CREATE TYPE "public"."corner_style" AS ENUM('square', 'rounded', 'extra-rounded');--> statement-breakpoint
CREATE TYPE "public"."pattern" AS ENUM('square', 'dot', 'rounded');--> statement-breakpoint
CREATE TABLE "qr_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"short_code" text,
	"destination_url" text NOT NULL,
	"title" text,
	"description" text,
	"type" "qr_type" DEFAULT 'static' NOT NULL,
	"scan_count" integer DEFAULT 0 NOT NULL,
	"last_scanned_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "qr_codes_short_code_unique" UNIQUE("short_code")
);
--> statement-breakpoint
CREATE TABLE "qr_styles" (
	"id" text PRIMARY KEY NOT NULL,
	"qr_code_id" text NOT NULL,
	"foreground_color" text DEFAULT '#000000' NOT NULL,
	"background_color" text DEFAULT '#FFFFFF' NOT NULL,
	"pattern" "pattern" DEFAULT 'square' NOT NULL,
	"corner_style" "corner_style" DEFAULT 'square' NOT NULL,
	"logo_data_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "qr_styles" ADD CONSTRAINT "qr_styles_qr_code_id_qr_codes_id_fk" FOREIGN KEY ("qr_code_id") REFERENCES "public"."qr_codes"("id") ON DELETE cascade ON UPDATE no action;