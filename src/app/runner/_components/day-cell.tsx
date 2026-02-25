"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { workoutTypeConfig, activityLabels } from "@/lib/workout-utils";

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

export type AvailabilityEntry = {
  id: string;
  date: string;
  note: string;
};

export type WorkoutLogEntry = {
  id: string;
  workoutId: string;
  completed: boolean;
  runnerNotes: string | null;
  hasUnreadComments?: boolean;
};

type DayCellProps = {
  dayLabel: string;
  dateNum: string;
  dayIso: string;
  todayStr: string;
  isToday: boolean;
  workout: Workout | null;
  availability: AvailabilityEntry | null;
  workoutLog: WorkoutLogEntry | null;
  compact?: boolean;
};

export default function DayCell({
  dayLabel,
  dateNum,
  dayIso,
  todayStr,
  isToday,
  workout,
  availability,
  workoutLog,
  compact = false,
}: DayCellProps) {
  const isFuture = dayIso > todayStr;
  const isPastOrToday = dayIso <= todayStr;
  const hasWorkout = !!workout;
  const isRest = workout?.workoutType === "REST";

  // Availability state (future days)
  const [cantTrain, setCantTrain] = useState(!!availability);
  const [availNote, setAvailNote] = useState(availability?.note ?? "");
  const [availId, setAvailId] = useState(availability?.id ?? null);

  // Workout log state (today/past with workout)
  const [completed, setCompleted] = useState(workoutLog?.completed ?? false);
  const [runnerNotes, setRunnerNotes] = useState(workoutLog?.runnerNotes ?? "");

  const typeCfg = workout
    ? workoutTypeConfig[workout.workoutType] || workoutTypeConfig.EASY
    : null;

  // --- Availability handlers ---
  const toggleCantTrain = useCallback(async () => {
    const newVal = !cantTrain;
    setCantTrain(newVal);

    if (newVal) {
      // Create availability entry
      const res = await fetch("/api/runner/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dayIso, note: availNote }),
      });
      if (res.ok) {
        const data = await res.json();
        setAvailId(data.id);
      } else {
        setCantTrain(false);
      }
    } else {
      // Delete availability entry
      if (availId) {
        await fetch(`/api/runner/availability/${availId}`, {
          method: "DELETE",
        });
        setAvailId(null);
        setAvailNote("");
      }
    }
  }, [cantTrain, dayIso, availNote, availId]);

  const saveAvailNote = useCallback(async () => {
    if (!cantTrain || !availId) return;
    await fetch("/api/runner/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dayIso, note: availNote }),
    });
  }, [cantTrain, availId, dayIso, availNote]);

  // --- Workout log handlers ---
  const toggleCompleted = useCallback(async () => {
    if (!workout) return;
    const newVal = !completed;
    setCompleted(newVal);

    const res = await fetch("/api/runner/workout-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workoutId: workout.id,
        completed: newVal,
        runnerNotes: runnerNotes || null,
      }),
    });
    if (!res.ok) {
      setCompleted(!newVal);
    }
  }, [completed, workout, runnerNotes]);

  const saveRunnerNotes = useCallback(async () => {
    if (!workout) return;
    await fetch("/api/runner/workout-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workoutId: workout.id,
        completed,
        runnerNotes: runnerNotes || null,
      }),
    });
  }, [workout, completed, runnerNotes]);

  // --- Cell background ---
  let cellBg = "bg-white border-gray-200";
  if (isToday) {
    cellBg = completed
      ? "ring-2 ring-blue-500 border-blue-500 bg-green-50"
      : "ring-2 ring-blue-500 border-blue-500 bg-blue-50";
    if (compact) {
      cellBg = completed
        ? "ring-1 ring-blue-400 border-blue-400 bg-green-50"
        : "ring-1 ring-blue-400 border-blue-400 bg-blue-50";
    }
  } else if (isFuture && cantTrain) {
    cellBg = "bg-red-50 border-red-200";
  } else if (isPastOrToday && hasWorkout && completed) {
    cellBg = "bg-green-50 border-green-200";
  } else if (isRest) {
    cellBg = compact ? "bg-gray-50 border-gray-100" : "bg-gray-50 border-gray-200";
  } else if (compact) {
    cellBg = "bg-white border-gray-100";
  }

  const minH = compact ? "min-h-[60px]" : "min-h-[80px]";
  const padding = compact ? "p-1.5" : "p-2";
  const roundedness = compact ? "rounded" : "rounded-md";

  // --- Workout content ---
  const workoutContent = workout ? (
    <div className={compact ? "mt-0.5" : ""}>
      <div className="flex items-center gap-1">
        <span
          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: typeCfg!.color }}
        />
        <span className="text-xs font-medium truncate">
          {workout.title || activityLabels[workout.activity] || workout.activity}
        </span>
      </div>
      {workout.workoutType !== "REST" && workout.distanceKm && (
        <div className="text-xs text-gray-500 mt-0.5">
          {parseFloat(workout.distanceKm)} km
        </div>
      )}
    </div>
  ) : null;

  // --- Controls ---
  const showAvailabilityControls = isFuture;
  const showCompletionControls = isPastOrToday && hasWorkout && !isRest;

  const controls = (
    <>
      {showAvailabilityControls && (
        <div className="mt-1" onClick={(e) => e.stopPropagation()}>
          <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={cantTrain}
              onChange={toggleCantTrain}
              className="rounded border-gray-300 text-red-500 focus:ring-red-400 h-3 w-3"
            />
            <span className={cantTrain ? "text-red-600" : ""}>Can&apos;t train</span>
          </label>
          {cantTrain && (
            <input
              type="text"
              value={availNote}
              onChange={(e) => setAvailNote(e.target.value)}
              onBlur={saveAvailNote}
              placeholder="Note..."
              className="mt-1 w-full text-xs border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-red-300"
            />
          )}
        </div>
      )}
      {showCompletionControls && (
        <div className="mt-1" onClick={(e) => e.stopPropagation()}>
          <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={completed}
              onChange={toggleCompleted}
              className="rounded border-gray-300 text-green-500 focus:ring-green-400 h-3 w-3"
            />
            <span className={completed ? "text-green-700 font-medium" : ""}>Done</span>
          </label>
          {completed && (
            <input
              type="text"
              value={runnerNotes}
              onChange={(e) => setRunnerNotes(e.target.value)}
              onBlur={saveRunnerNotes}
              placeholder="Notes..."
              className="mt-1 w-full text-xs border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-green-300"
            />
          )}
        </div>
      )}
    </>
  );

  const isLinkable = workout && workout.workoutType !== "REST";

  return (
    <div className={`border ${roundedness} ${padding} ${minH} ${cellBg}`}>
      <div className={`flex items-center justify-between ${compact ? "" : "mb-1"}`}>
        <span
          className={`text-xs ${isToday ? "text-blue-600 font-medium" : compact ? "text-gray-400" : "text-gray-500"}`}
        >
          {dayLabel} {dateNum}
        </span>
        {workoutLog?.hasUnreadComments && (
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
        )}
      </div>
      {isLinkable ? (
        <Link href={`/runner/workout/${workout!.id}`}>{workoutContent}</Link>
      ) : (
        workoutContent
      )}
      {controls}
    </div>
  );
}
