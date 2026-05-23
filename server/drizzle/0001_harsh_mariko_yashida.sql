CREATE TABLE "event_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"url" text NOT NULL,
	"is_master" boolean DEFAULT false,
	"caption" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "volunteer_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"volunteer_id" integer NOT NULL,
	"full_name" varchar(255),
	"prn_no" varchar(50),
	"department" varchar(100),
	"academic_year" varchar(20),
	"nss_year" integer,
	"marksheet_url" text,
	"cgpa" varchar(10),
	"eligibility_no" varchar(50),
	"religion" varchar(50),
	"caste" varchar(100),
	"caste_category" varchar(50),
	"phone_no" varchar(20),
	"email_id" varchar(255),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "volunteer_profiles_volunteer_id_unique" UNIQUE("volunteer_id")
);
--> statement-breakpoint
CREATE TABLE "volunteers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "volunteers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "volunteers_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "event_images" ADD CONSTRAINT "event_images_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_volunteer_id_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteers" ADD CONSTRAINT "volunteers_created_by_id_admins_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;