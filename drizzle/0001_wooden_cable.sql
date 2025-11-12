CREATE TABLE "bridge_db"."checkpoints" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"last_block" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bridge_db"."bridge_jobs" ADD COLUMN "from_address" text;