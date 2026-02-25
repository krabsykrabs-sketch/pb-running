"use client";

import Link from "next/link";
import { workoutTypeConfig, activityLabels } from "@/lib/workout-utils";
import DayCell from "./day-cell";
import type { AvailabilityEntry, WorkoutLogEntry } from "./day-cell";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Workout = {
  id: string;
  date: string;
  title: string;
  workoutType: string;
  activity: string;
  distanceKm: string | null;
  targetPace: string | null;
  durationMin: number | null;
  intensity: string;
  details: string;
  nutrition: string | null;
};

type Week = {
  id: string;
  weekNumber: number;
  startDate: string;
  targetKm: string | null;
  weekIntensity: string | null;
  workouts: Workout[];
};

type Block = {
  id: string;
  name: string;
  weeks: Week[];
};

type Plan = {
  id: string;
  name: string;
  goal: string;
  raceDate: string | null;
  startDate: string;
  endDate: string;
  blocks: Block[];
};

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function findCurrentWeek(plan: Plan): Week | null {
  const today = getTodayStr();
  for (const block of plan.blocks) {
    for (const week of block.weeks) {
      const start = new Date(week.startDate);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 6);
      const startStr = start.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];
      if (today >= startStr && today <= endStr) return week;
    }
  }
  return null;
}

function findTodayWorkout(plan: Plan): Workout | null {
  const today = getTodayStr();
  for (const block of plan.blocks) {
    for (const week of block.weeks) {
      for (const w of week.workouts) {
        if (w.date.split("T")[0] === today) return w;
      }
    }
  }
  return null;
}

type Props = {
  plan: Plan | null;
  availabilityByDate: Record<string, AvailabilityEntry>;
  logsByWorkoutId: Record<string, WorkoutLogEntry>;
};

export default function RunnerDashboard({
  plan,
  availabilityByDate,
  logsByWorkoutId,
}: Props) {
  if (!plan) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-500">No active training plan</p>
        <p className="text-sm text-gray-400 mt-1">
          Your coach will activate a plan for you soon.
        </p>
      </div>
    );
  }

  const todayWorkout = findTodayWorkout(plan);
  const currentWeek = findCurrentWeek(plan);
  const todayStr = getTodayStr();

  // Race countdown
  const daysToRace = plan.raceDate
    ? Math.ceil(
        (new Date(plan.raceDate).getTime() - new Date(todayStr).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{plan.name}</h1>
      <p className="text-sm text-gray-600">{plan.goal}</p>

      {/* Race countdown */}
      {daysToRace !== null && daysToRace > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-700">{daysToRace}</div>
          <div className="text-sm text-blue-600">days to race</div>
          <div className="text-xs text-blue-500 mt-1">
            {new Date(plan.raceDate!).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
      )}

      {/* Today's workout */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Today
        </h2>
        {todayWorkout ? (
          <Link href={`/runner/workout/${todayWorkout.id}`}>
            <TodayCard workout={todayWorkout} />
          </Link>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-500">
            No workout scheduled for today
          </div>
        )}
      </div>

      {/* Current week grid */}
      {currentWeek && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            This Week — Week {currentWeek.weekNumber}
            {currentWeek.weekIntensity && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                {currentWeek.weekIntensity}
              </span>
            )}
          </h2>
          <WeekGrid
            week={currentWeek}
            todayStr={todayStr}
            availabilityByDate={availabilityByDate}
            logsByWorkoutId={logsByWorkoutId}
          />
        </div>
      )}
    </div>
  );
}

function TodayCard({ workout }: { workout: Workout }) {
  const typeCfg = workoutTypeConfig[workout.workoutType] || workoutTypeConfig.EASY;

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 border-l-4 ${typeCfg.borderClass}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeCfg.bgClass}`}>
          {typeCfg.label}
        </span>
        <span className="text-xs text-gray-500">
          {activityLabels[workout.activity] || workout.activity}
        </span>
      </div>
      <h3 className="font-semibold text-lg">{workout.title}</h3>
      <div className="flex gap-4 mt-2 text-sm text-gray-600">
        {workout.distanceKm && <span>{parseFloat(workout.distanceKm)} km</span>}
        {workout.targetPace && <span>{workout.targetPace} min/km</span>}
        {workout.durationMin && <span>{workout.durationMin} min</span>}
      </div>
      {workout.details && (
        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{workout.details}</p>
      )}
      {workout.nutrition && (
        <p className="text-xs text-amber-600 mt-2">Nutrition: {workout.nutrition}</p>
      )}
    </div>
  );
}

function WeekGrid({
  week,
  todayStr,
  availabilityByDate,
  logsByWorkoutId,
}: {
  week: Week;
  todayStr: string;
  availabilityByDate: Record<string, AvailabilityEntry>;
  logsByWorkoutId: Record<string, WorkoutLogEntry>;
}) {
  const workoutsByDay = new Map<number, Workout>();
  week.workouts.forEach((w) => {
    const d = new Date(w.date);
    const dayOfWeek = d.getUTCDay();
    const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    workoutsByDay.set(idx, w);
  });

  return (
    <div className="grid grid-cols-7 gap-1">
      {DAY_LABELS.map((day, idx) => {
        const workout = workoutsByDay.get(idx) ?? null;

        const dayDate = new Date(week.startDate);
        dayDate.setUTCDate(dayDate.getUTCDate() + idx);
        const dateNum = dayDate.getUTCDate().toString();
        const dayIso = dayDate.toISOString().split("T")[0];
        const isToday = dayIso === todayStr;

        const availability = availabilityByDate[dayIso] ?? null;
        const workoutLog = workout ? logsByWorkoutId[workout.id] ?? null : null;

        return (
          <DayCell
            key={idx}
            dayLabel={day}
            dateNum={dateNum}
            dayIso={dayIso}
            todayStr={todayStr}
            isToday={isToday}
            workout={workout}
            availability={availability}
            workoutLog={workoutLog}
          />
        );
      })}
    </div>
  );
}
