"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  workoutTypeConfig,
  activityLabels,
  intensityConfig,
} from "@/lib/workout-utils";

type CommentAuthor = {
  id: string;
  name: string;
  role: string;
};

type Comment = {
  id: string;
  workoutLogId: string;
  authorId: string;
  content: string;
  read: boolean;
  createdAt: string;
  author: CommentAuthor;
};

type WorkoutLog = {
  id: string;
  workoutId: string;
  runnerId: string;
  completed: boolean;
  actualDistanceKm: string | null;
  actualPace: string | null;
  actualDurationMin: number | null;
  avgHeartRate: number | null;
  rpe: number | null;
  runnerNotes: string | null;
  loggedAt: string;
  comments: Comment[];
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
  week: {
    id: string;
    weekNumber: number;
    startDate: string;
  };
};

export default function WorkoutDetail({
  workout,
  log: initialLog,
  userId,
}: {
  workout: Workout;
  log: WorkoutLog | null;
  userId: string;
}) {
  const typeCfg =
    workoutTypeConfig[workout.workoutType] || workoutTypeConfig.EASY;
  const intCfg = intensityConfig[workout.intensity];

  const date = new Date(workout.date);
  const dateStr = date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const workoutDateStr = workout.date.split("T")[0];
  const canLog = workoutDateStr <= todayStr;

  // Log form state
  const [completed, setCompleted] = useState(initialLog?.completed ?? false);
  const [actualDistanceKm, setActualDistanceKm] = useState(
    initialLog?.actualDistanceKm ? String(initialLog.actualDistanceKm) : ""
  );
  const [actualPace, setActualPace] = useState(initialLog?.actualPace ?? "");
  const [actualDurationMin, setActualDurationMin] = useState(
    initialLog?.actualDurationMin ? String(initialLog.actualDurationMin) : ""
  );
  const [avgHeartRate, setAvgHeartRate] = useState(
    initialLog?.avgHeartRate ? String(initialLog.avgHeartRate) : ""
  );
  const [rpe, setRpe] = useState(
    initialLog?.rpe ? String(initialLog.rpe) : ""
  );
  const [runnerNotes, setRunnerNotes] = useState(
    initialLog?.runnerNotes ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Comments state
  const [comments, setComments] = useState<Comment[]>(
    initialLog?.comments ?? []
  );
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [logId, setLogId] = useState(initialLog?.id ?? null);

  // Mark unread coach comments as read on mount
  useEffect(() => {
    if (!logId) return;
    const hasUnread = comments.some(
      (c) => !c.read && c.authorId !== userId
    );
    if (hasUnread) {
      fetch(`/api/workout-logs/${logId}/comments/read`, {
        method: "PUT",
      });
    }
  }, [logId, comments, userId]);

  const handleSaveLog = useCallback(async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/runner/workout-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutId: workout.id,
          completed,
          runnerNotes: runnerNotes || null,
          actualDistanceKm: actualDistanceKm
            ? parseFloat(actualDistanceKm)
            : null,
          actualPace: actualPace || null,
          actualDurationMin: actualDurationMin
            ? parseInt(actualDurationMin)
            : null,
          avgHeartRate: avgHeartRate ? parseInt(avgHeartRate) : null,
          rpe: rpe ? parseInt(rpe) : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLogId(data.id);
        setSaveMsg("Saved");
        setTimeout(() => setSaveMsg(""), 2000);
      } else {
        const data = await res.json();
        setSaveMsg(data.error || "Failed to save");
      }
    } catch {
      setSaveMsg("Failed to save");
    }
    setSaving(false);
  }, [
    workout.id,
    completed,
    runnerNotes,
    actualDistanceKm,
    actualPace,
    actualDurationMin,
    avgHeartRate,
    rpe,
  ]);

  const handlePostComment = useCallback(async () => {
    if (!logId || !newComment.trim()) return;
    setPostingComment(true);
    try {
      const res = await fetch(`/api/workout-logs/${logId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setNewComment("");
      }
    } catch {
      // silently fail
    }
    setPostingComment(false);
  }, [logId, newComment]);

  const hasActualData =
    actualDistanceKm || actualPace || actualDurationMin || avgHeartRate || rpe;

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/runner/calendar"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to calendar
        </Link>
      </div>

      {/* Planned card */}
      <div
        className={`bg-white rounded-lg border border-gray-200 shadow-sm border-l-4 ${typeCfg.borderClass} p-5 mb-4`}
      >
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
          Planned
        </div>
        <div className="text-sm text-gray-500 mb-1">
          {dateStr} — Week {workout.week.weekNumber}
        </div>
        <h1 className="text-xl font-bold mb-3">{workout.title}</h1>

        <div className="flex flex-wrap gap-2 mb-4">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeCfg.bgClass}`}
          >
            {typeCfg.label}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {activityLabels[workout.activity] || workout.activity}
          </span>
          {intCfg && (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${intCfg.bgClass}`}
            >
              {intCfg.label}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {workout.distanceKm && (
            <div className="bg-gray-50 rounded-md p-3 text-center">
              <div className="text-lg font-semibold">
                {parseFloat(workout.distanceKm)} km
              </div>
              <div className="text-xs text-gray-500">Distance</div>
            </div>
          )}
          {workout.targetPace && (
            <div className="bg-gray-50 rounded-md p-3 text-center">
              <div className="text-lg font-semibold">{workout.targetPace}</div>
              <div className="text-xs text-gray-500">Target Pace (min/km)</div>
            </div>
          )}
          {workout.durationMin && (
            <div className="bg-gray-50 rounded-md p-3 text-center">
              <div className="text-lg font-semibold">
                {workout.durationMin} min
              </div>
              <div className="text-xs text-gray-500">Duration</div>
            </div>
          )}
        </div>

        {workout.details && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">
              Details
            </h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {workout.details}
            </p>
          </div>
        )}

        {workout.nutrition && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <h2 className="text-sm font-semibold text-amber-700 mb-1">
              Nutrition
            </h2>
            <p className="text-sm text-amber-600 whitespace-pre-wrap">
              {workout.nutrition}
            </p>
          </div>
        )}
      </div>

      {/* Log form (past/today only) */}
      {canLog && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Your Log
          </div>

          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="rounded border-gray-300 text-green-500 focus:ring-green-400 h-4 w-4"
            />
            <span
              className={`text-sm font-medium ${completed ? "text-green-700" : "text-gray-700"}`}
            >
              {completed ? "Completed" : "Mark as completed"}
            </span>
          </label>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Actual Distance (km)
              </label>
              <input
                type="number"
                step="0.1"
                value={actualDistanceKm}
                onChange={(e) => setActualDistanceKm(e.target.value)}
                className={inputClass}
                placeholder="e.g. 10.5"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Actual Pace (min/km)
              </label>
              <input
                type="text"
                value={actualPace}
                onChange={(e) => setActualPace(e.target.value)}
                className={inputClass}
                placeholder="e.g. 5:30"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Duration (min)
              </label>
              <input
                type="number"
                value={actualDurationMin}
                onChange={(e) => setActualDurationMin(e.target.value)}
                className={inputClass}
                placeholder="e.g. 55"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Avg Heart Rate
              </label>
              <input
                type="number"
                value={avgHeartRate}
                onChange={(e) => setAvgHeartRate(e.target.value)}
                className={inputClass}
                placeholder="e.g. 145"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                RPE (1-10)
              </label>
              <select
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
                className={inputClass}
              >
                <option value="">—</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Notes</label>
            <textarea
              value={runnerNotes}
              onChange={(e) => setRunnerNotes(e.target.value)}
              className={inputClass}
              rows={2}
              placeholder="How did it feel?"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveLog}
              disabled={saving}
              className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Log"}
            </button>
            {saveMsg && (
              <span
                className={`text-sm ${saveMsg === "Saved" ? "text-green-600" : "text-red-600"}`}
              >
                {saveMsg}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Planned vs Actual comparison */}
      {hasActualData && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Planned vs Actual
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="pb-2 font-medium">Metric</th>
                <th className="pb-2 font-medium">Planned</th>
                <th className="pb-2 font-medium">Actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(workout.distanceKm || actualDistanceKm) && (
                <tr>
                  <td className="py-2 text-gray-600">Distance</td>
                  <td className="py-2">
                    {workout.distanceKm
                      ? `${parseFloat(workout.distanceKm)} km`
                      : "—"}
                  </td>
                  <td className="py-2 font-medium">
                    {actualDistanceKm ? `${actualDistanceKm} km` : "—"}
                  </td>
                </tr>
              )}
              {(workout.targetPace || actualPace) && (
                <tr>
                  <td className="py-2 text-gray-600">Pace</td>
                  <td className="py-2">
                    {workout.targetPace
                      ? `${workout.targetPace} min/km`
                      : "—"}
                  </td>
                  <td className="py-2 font-medium">
                    {actualPace ? `${actualPace} min/km` : "—"}
                  </td>
                </tr>
              )}
              {(workout.durationMin || actualDurationMin) && (
                <tr>
                  <td className="py-2 text-gray-600">Duration</td>
                  <td className="py-2">
                    {workout.durationMin ? `${workout.durationMin} min` : "—"}
                  </td>
                  <td className="py-2 font-medium">
                    {actualDurationMin ? `${actualDurationMin} min` : "—"}
                  </td>
                </tr>
              )}
              {avgHeartRate && (
                <tr>
                  <td className="py-2 text-gray-600">Heart Rate</td>
                  <td className="py-2">—</td>
                  <td className="py-2 font-medium">{avgHeartRate} bpm</td>
                </tr>
              )}
              {rpe && (
                <tr>
                  <td className="py-2 text-gray-600">RPE</td>
                  <td className="py-2">—</td>
                  <td className="py-2 font-medium">{rpe}/10</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Comments section */}
      {logId && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Comments
          </div>

          {comments.length === 0 && (
            <p className="text-sm text-gray-400 mb-3">No comments yet.</p>
          )}

          <div className="space-y-3 mb-4">
            {comments.map((c) => {
              const isCoach = c.author.role === "COACH";
              return (
                <div
                  key={c.id}
                  className={`rounded-md p-3 text-sm ${
                    isCoach
                      ? "bg-blue-50 border border-blue-100"
                      : "bg-gray-50 border border-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800">
                      {c.author.name}
                    </span>
                    {isCoach && (
                      <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5">
                        Coach
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {c.content}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handlePostComment();
                }
              }}
              placeholder="Write a comment..."
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handlePostComment}
              disabled={postingComment || !newComment.trim()}
              className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {postingComment ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
