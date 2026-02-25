-- AlterTable: Add new columns to session_catalogue
ALTER TABLE "session_catalogue" ADD COLUMN "activity" "Activity";
ALTER TABLE "session_catalogue" ADD COLUMN "workout_type" "WorkoutType";
ALTER TABLE "session_catalogue" ADD COLUMN "distance_km" DECIMAL(65,30);
ALTER TABLE "session_catalogue" ADD COLUMN "target_pace" TEXT;
ALTER TABLE "session_catalogue" ADD COLUMN "duration_min" INTEGER;
ALTER TABLE "session_catalogue" ADD COLUMN "intensity" "Intensity";
ALTER TABLE "session_catalogue" ADD COLUMN "details" TEXT NOT NULL DEFAULT '';
ALTER TABLE "session_catalogue" ADD COLUMN "coach_notes" TEXT;
ALTER TABLE "session_catalogue" ADD COLUMN "nutrition" TEXT;

-- Data migration: category → activity
UPDATE "session_catalogue" SET "activity" = 'CYCLE' WHERE "category" = 'CYCLING';
UPDATE "session_catalogue" SET "activity" = 'SWIM' WHERE "category" = 'SWIMMING';
UPDATE "session_catalogue" SET "activity" = 'HIKE' WHERE "category" = 'HIKING';
UPDATE "session_catalogue" SET "activity" = 'SC' WHERE "category" = 'SC';
UPDATE "session_catalogue" SET "activity" = 'OTHER' WHERE "category" = 'OTHER';
-- Fallback for any unmapped values
UPDATE "session_catalogue" SET "activity" = 'OTHER' WHERE "activity" IS NULL;

-- Data migration: description → details
UPDATE "session_catalogue" SET "details" = "description" WHERE "description" IS NOT NULL AND "description" != '';

-- Data migration: duration → duration_min (best-effort parse)
UPDATE "session_catalogue" SET "duration_min" = CAST(
  (regexp_match("duration", '(\d+)'))[1] AS INTEGER
) WHERE "duration" ~ '^\d+';

-- Set default workout_type based on old category
UPDATE "session_catalogue" SET "workout_type" = 'SC' WHERE "category" = 'SC';
UPDATE "session_catalogue" SET "workout_type" = 'CROSS_TRAINING' WHERE "category" != 'SC';

-- Make activity NOT NULL
ALTER TABLE "session_catalogue" ALTER COLUMN "activity" SET NOT NULL;

-- Drop old columns
ALTER TABLE "session_catalogue" DROP COLUMN "category";
ALTER TABLE "session_catalogue" DROP COLUMN "duration";
ALTER TABLE "session_catalogue" DROP COLUMN "description";

-- Drop SessionCategory enum
DROP TYPE "SessionCategory";
