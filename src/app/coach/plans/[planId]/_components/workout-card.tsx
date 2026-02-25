"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  workoutTypeConfig,
  activityLabels,
  intensityConfig,
} from "@/lib/workout-utils";
import WorkoutForm from "./workout-form";
import type { Workout, CatalogueSession } from "./plan-detail";

export default function WorkoutCard({
  workout,
  weekId,
  catalogueSessions,
}: {
  workout: Workout;
  weekId: string;
  catalogueSessions: CatalogueSession[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!confirm("Delete this workout?")) return;
    try {
      await fetch(`/api/weeks/${weekId}/workouts/${workout.id}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch {
      setError("Failed to delete workout");
    }
  }

  const typeCfg = workoutTypeConfig[workout.workoutType] || workoutTypeConfig.EASY;
  const intCfg = intensityConfig[workout.intensity] || intensityConfig.MODERATE;

  if (editing) {
    return (
      <WorkoutForm
        weekId={weekId}
        date={workout.date.split("T")[0]}
        catalogueSessions={catalogueSessions}
        initial={workout}
        onSave={() => {
          setEditing(false);
          router.refresh();
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div
      className={`border-l-4 ${typeCfg.borderClass} bg-white rounded-r-md border border-gray-200 px-3 py-2`}
    >
      {error && (
        <div className="bg-red-50 text-red-600 text-xs rounded p-1 mb-1">
          {error}
        </div>
      )}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{workout.title}</span>
            <span
              className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${typeCfg.bgClass}`}
            >
              {typeCfg.label}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${intCfg.bgClass}`}
            >
              {intCfg.label}
            </span>
            {workout.activity !== "RUN" && (
              <span className="text-xs text-gray-500">
                {activityLabels[workout.activity] || workout.activity}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span>{new Date(workout.date).toLocaleDateString()}</span>
            {workout.distanceKm && (
              <span>{parseFloat(workout.distanceKm)} km</span>
            )}
            {workout.targetPace && <span>{workout.targetPace}</span>}
            {workout.durationMin && <span>{workout.durationMin} min</span>}
          </div>
          {workout.details && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {workout.details}
            </p>
          )}
          {workout.coachNotes && (
            <p className="text-xs text-blue-600 mt-1">
              Coach: {workout.coachNotes}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
