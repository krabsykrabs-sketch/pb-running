-- CreateEnum
CREATE TYPE "Role" AS ENUM ('COACH', 'RUNNER');

-- CreateEnum
CREATE TYPE "GoalPriority" AS ENUM ('FINISH', 'TIME_GOAL', 'ENJOY');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'ACHIEVED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "SessionCategory" AS ENUM ('CYCLING', 'SC', 'SWIMMING', 'HIKING', 'OTHER');

-- CreateEnum
CREATE TYPE "HealthSeverity" AS ENUM ('MINOR', 'MODERATE', 'SEVERE');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('ACTIVE', 'RESOLVED');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "WorkoutType" AS ENUM ('EASY', 'LONG', 'TEMPO', 'INTERVAL', 'RACE_PACE', 'HR_TRAINING', 'SC', 'REST', 'CROSS_TRAINING', 'RACE');

-- CreateEnum
CREATE TYPE "Activity" AS ENUM ('RUN', 'CYCLE', 'SWIM', 'HIKE', 'SC', 'REST', 'OTHER');

-- CreateEnum
CREATE TYPE "Intensity" AS ENUM ('LOW', 'MODERATE', 'HIGH');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('WEEK', 'BLOCK');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "strava_access_token" TEXT,
    "strava_refresh_token" TEXT,
    "strava_athlete_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runner_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "phone" TEXT,
    "years_running" INTEGER,
    "current_weekly_km" DECIMAL(65,30),
    "recent_races" TEXT,
    "goal_race" TEXT,
    "goal_race_date" DATE,
    "goal_time" TEXT,
    "goal_priority" "GoalPriority",
    "training_days_per_week" INTEGER,
    "preferred_days" TEXT,
    "preferred_time_of_day" TEXT,
    "max_session_length_min" INTEGER,
    "chronic_conditions" TEXT,
    "medications" TEXT,
    "diet_type" TEXT,
    "dietary_restrictions" TEXT,
    "hydration_habits" TEXT,
    "previous_coaching" TEXT,
    "has_hr_monitor" BOOLEAN NOT NULL DEFAULT false,
    "has_gym_access" BOOLEAN NOT NULL DEFAULT false,
    "has_track_access" BOOLEAN NOT NULL DEFAULT false,
    "other_notes" TEXT,
    "review_interval_days" INTEGER NOT NULL DEFAULT 7,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "runner_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_plans" (
    "id" TEXT NOT NULL,
    "runner_id" TEXT NOT NULL,
    "general_strategy" TEXT,
    "race_day" TEXT,
    "supplements" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nutrition_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_bests" (
    "id" TEXT NOT NULL,
    "runner_id" TEXT NOT NULL,
    "distance" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "race_name" TEXT,
    "date" DATE NOT NULL,

    CONSTRAINT "personal_bests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "runner_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "target_date" DATE NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_catalogue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "SessionCategory" NOT NULL,
    "duration" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_pb_running" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_catalogue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "race_type" TEXT NOT NULL,
    "duration_weeks" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "structure" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_log" (
    "id" TEXT NOT NULL,
    "runner_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "body_part" TEXT NOT NULL,
    "severity" "HealthSeverity" NOT NULL,
    "status" "HealthStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runner_availability" (
    "id" TEXT NOT NULL,
    "runner_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "runner_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "runner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "race_date" DATE,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weeks" (
    "id" TEXT NOT NULL,
    "block_id" TEXT NOT NULL,
    "week_number" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "description" TEXT,
    "target_km" DECIMAL(65,30),
    "week_intensity" TEXT,
    "paces_focus" TEXT,
    "coach_week_note" TEXT,
    "is_populated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workouts" (
    "id" TEXT NOT NULL,
    "week_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "workout_type" "WorkoutType" NOT NULL,
    "activity" "Activity" NOT NULL,
    "distance_km" DECIMAL(65,30),
    "target_pace" TEXT,
    "duration_min" INTEGER,
    "intensity" "Intensity" NOT NULL,
    "details" TEXT NOT NULL,
    "coach_notes" TEXT,
    "nutrition" TEXT,
    "is_pb_running" BOOLEAN NOT NULL DEFAULT false,
    "catalogue_session_id" TEXT,

    CONSTRAINT "workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_logs" (
    "id" TEXT NOT NULL,
    "workout_id" TEXT NOT NULL,
    "runner_id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "actual_distance_km" DECIMAL(65,30),
    "actual_pace" TEXT,
    "actual_duration_min" INTEGER,
    "avg_heart_rate" INTEGER,
    "rpe" INTEGER,
    "runner_notes" TEXT,
    "strava_activity_id" TEXT,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "workout_log_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strava_activities" (
    "id" TEXT NOT NULL,
    "runner_id" TEXT NOT NULL,
    "strava_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "distance_km" DECIMAL(65,30) NOT NULL,
    "duration_min" DECIMAL(65,30) NOT NULL,
    "avg_pace" TEXT NOT NULL,
    "avg_heart_rate" INTEGER,
    "start_date" TIMESTAMP(3) NOT NULL,
    "raw_data" JSONB NOT NULL,
    "linked_workout_id" TEXT,

    CONSTRAINT "strava_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TemplateType" NOT NULL,
    "description" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runner_reviews" (
    "id" TEXT NOT NULL,
    "runner_id" TEXT NOT NULL,
    "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT NOT NULL,

    CONSTRAINT "runner_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "runner_profiles_user_id_key" ON "runner_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "nutrition_plans_runner_id_key" ON "nutrition_plans"("runner_id");

-- CreateIndex
CREATE UNIQUE INDEX "runner_availability_runner_id_date_key" ON "runner_availability"("runner_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "workout_logs_workout_id_key" ON "workout_logs"("workout_id");

-- CreateIndex
CREATE UNIQUE INDEX "workout_logs_workout_id_runner_id_key" ON "workout_logs"("workout_id", "runner_id");

-- CreateIndex
CREATE UNIQUE INDEX "strava_activities_strava_id_key" ON "strava_activities"("strava_id");

-- CreateIndex
CREATE UNIQUE INDEX "strava_activities_linked_workout_id_key" ON "strava_activities"("linked_workout_id");

-- AddForeignKey
ALTER TABLE "runner_profiles" ADD CONSTRAINT "runner_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_plans" ADD CONSTRAINT "nutrition_plans_runner_id_fkey" FOREIGN KEY ("runner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_bests" ADD CONSTRAINT "personal_bests_runner_id_fkey" FOREIGN KEY ("runner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_runner_id_fkey" FOREIGN KEY ("runner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_log" ADD CONSTRAINT "health_log_runner_id_fkey" FOREIGN KEY ("runner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_log" ADD CONSTRAINT "health_log_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runner_availability" ADD CONSTRAINT "runner_availability_runner_id_fkey" FOREIGN KEY ("runner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_runner_id_fkey" FOREIGN KEY ("runner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weeks" ADD CONSTRAINT "weeks_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_week_id_fkey" FOREIGN KEY ("week_id") REFERENCES "weeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_catalogue_session_id_fkey" FOREIGN KEY ("catalogue_session_id") REFERENCES "session_catalogue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_runner_id_fkey" FOREIGN KEY ("runner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_workout_log_id_fkey" FOREIGN KEY ("workout_log_id") REFERENCES "workout_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strava_activities" ADD CONSTRAINT "strava_activities_runner_id_fkey" FOREIGN KEY ("runner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strava_activities" ADD CONSTRAINT "strava_activities_linked_workout_id_fkey" FOREIGN KEY ("linked_workout_id") REFERENCES "workouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runner_reviews" ADD CONSTRAINT "runner_reviews_runner_id_fkey" FOREIGN KEY ("runner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
