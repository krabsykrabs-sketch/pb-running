"use client";

import DayCell from "./day-cell";
import type { AvailabilityEntry, WorkoutLogEntry } from "./day-cell";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const weekTypeColor: Record<string, string> = {
  Build: "text-blue-700",
  Low: "text-green-700",
  Moderate: "text-yellow-700",
  High: "text-red-700",
  Taper: "text-purple-700",
  "Race Week": "text-orange-700",
};

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
  description: string;
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

function isCurrentWeek(week: Week, todayStr: string): boolean {
  const start = new Date(week.startDate);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const startStr = start.toISOString().split("T")[0];
  const endStr = end.toISOString().split("T")[0];
  return todayStr >= startStr && todayStr <= endStr;
}

type Props = {
  plan: Plan | null;
  availabilityByDate: Record<string, AvailabilityEntry>;
  logsByWorkoutId: Record<string, WorkoutLogEntry>;
};

export default function PlanCalendar({
  plan,
  availabilityByDate,
  logsByWorkoutId,
}: Props) {
  if (!plan) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2">Calendar</h1>
        <p className="text-gray-500">No active training plan</p>
      </div>
    );
  }

  const todayStr = getTodayStr();

  return (
    <div>
      {/* Plan header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{plan.name}</h1>
        <p className="text-sm text-gray-600">{plan.goal}</p>
        <div className="flex gap-4 mt-1 text-xs text-gray-500">
          <span>
            {new Date(plan.startDate).toLocaleDateString()} —{" "}
            {new Date(plan.endDate).toLocaleDateString()}
          </span>
          {plan.raceDate && (
            <span className="text-blue-600 font-medium">
              Race: {new Date(plan.raceDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Blocks and weeks */}
      <div className="space-y-6">
        {plan.blocks.map((block) => (
          <div key={block.id}>
            <div className="mb-2">
              <h2 className="text-sm font-semibold text-gray-700">{block.name}</h2>
              {block.description && (
                <p className="text-xs text-gray-500">{block.description}</p>
              )}
            </div>
            <div className="space-y-2">
              {block.weeks.map((week) => (
                <CalendarWeek
                  key={week.id}
                  week={week}
                  isCurrent={isCurrentWeek(week, todayStr)}
                  todayStr={todayStr}
                  availabilityByDate={availabilityByDate}
                  logsByWorkoutId={logsByWorkoutId}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarWeek({
  week,
  isCurrent,
  todayStr,
  availabilityByDate,
  logsByWorkoutId,
}: {
  week: Week;
  isCurrent: boolean;
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

  const scheduledKm = week.workouts
    .filter((w) => w.activity === "RUN" && w.distanceKm)
    .reduce((sum, w) => sum + parseFloat(w.distanceKm!), 0);

  const startDate = new Date(week.startDate);
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 6);

  return (
    <div
      className={`bg-white rounded-lg border p-3 ${
        isCurrent ? "ring-2 ring-blue-500 border-blue-500" : "border-gray-200"
      }`}
    >
      {/* Week header */}
      <div className="flex items-center gap-3 mb-2">
        <span className="font-medium text-sm">Week {week.weekNumber}</span>
        <span className="text-xs text-gray-500">
          {startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          {" — "}
          {endDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </span>
        {week.weekIntensity && (
          <span
            className={`text-xs font-medium ${weekTypeColor[week.weekIntensity] || "text-gray-600"}`}
          >
            {week.weekIntensity}
          </span>
        )}
        {scheduledKm > 0 && (
          <span className="text-xs text-gray-400">{Math.round(scheduledKm)} km</span>
        )}
        {isCurrent && (
          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
            Current
          </span>
        )}
      </div>

      {/* 7-day grid */}
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
              compact
            />
          );
        })}
      </div>
    </div>
  );
}
