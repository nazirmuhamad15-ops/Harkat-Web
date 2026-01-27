CREATE TABLE "tracking_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"accuracy" double precision,
	"speed" double precision,
	"heading" double precision,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tracking_logs" ADD CONSTRAINT "tracking_logs_task_id_driver_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."driver_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tracking_logs_task_id_idx" ON "tracking_logs" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "tracking_logs_timestamp_idx" ON "tracking_logs" USING btree ("timestamp");