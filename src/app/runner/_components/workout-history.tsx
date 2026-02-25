"use client";

import Link from "next/link";
import { workoutTypeConfig, activityLabels } from "@/lib/workout-utils";

type LogEntry = {
  id: string;
  workoutId: string;
  completed: boolean;
  actualDistanceKm: string | null;
  actualPace: string | null;
  actualDurationMin: number | null;
  avgHeartRate: number | null;
  rpe: number | null;
  runnerNotes: string | null;
  loggedAt: string;
  commentCount: number;
  hasUnreadComments: boolean;
  workout: {
    id: string;
    date: string;
    title: string;
    workoutType: string;
    activity: string;
    distanceKm: string | null;
    targetPace: string | null;
    durationMin: number | null;
    intensity: string;
  };
};

export default function WorkoutHistory({ logs }: { logs: LogEntry[] }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2">Workout History</h1>
        <p className="text-gray-500">
          No logged workouts yet. Complete a workout to see it here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Workout History</h1>
      <div className="space-y-2">
        {logs.map((log) => {
          const typeCfg =
            workoutTypeConfig[log.workout.workoutType] ||
            workoutTypeConfig.EASY;
          const dateStr = new Date(log.workout.date).toLocaleDateString(
            "en-GB",
            {
              weekday: "short",
              day: "numeric",
              month: "short",
            }
          );

          return (
            <Link
              key={log.id}
              href={`/runner/workout/${log.workoutId}`}
              className="block"
            >
              <div
                className={`bg-white rounded-lg border border-gray-200 shadow-sm border-l-4 ${typeCfg.borderClass} p-3 hover:bg-gray-50 transition-colors`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500">{dateStr}</span>
                      <span
                        className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${typeCfg.bgClass}`}
                      >
                        {typeCfg.label}
                      </span>
                      {log.workout.activity !== "RUN" && (
                        <span className="text-xs text-gray-500">
                          {activityLabels[log.workout.activity] ||
                            log.workout.activity}
                        </span>
                      )}
                      {log.completed && (
                        <span className="text-xs bg-green-100 text-green-700 rounded-full px-1.5 py-0.5">
                          Completed
                        </span>
                      )}
                    </div>
                    <div className="font-medium text-sm truncate">
                      {log.workout.title}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {log.actualDistanceKm && (
                        <span>{parseFloat(log.actualDistanceKm)} km</span>
                      )}
                      {log.actualPace && <span>{log.actualPace} min/km</span>}
                      {log.actualDurationMin && (
                        <span>{log.actualDurationMin} min</span>
                      )}
                      {log.avgHeartRate && (
                        <span>{log.avgHeartRate} bpm</span>
                      )}
                      {log.rpe && <span>RPE {log.rpe}/10</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    {log.commentCount > 0 && (
                      <span
                        className={`text-xs rounded-full px-1.5 py-0.5 ${
                          log.hasUnreadComments
                            ? "bg-blue-100 text-blue-700 font-medium"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {log.commentCount} comment
                        {log.commentCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {log.hasUnreadComments && (
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
