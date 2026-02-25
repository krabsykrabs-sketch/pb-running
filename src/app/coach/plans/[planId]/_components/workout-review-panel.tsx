"use client";

import { useState, useEffect, useCallback } from "react";
import {
  workoutTypeConfig,
  activityLabels,
  intensityConfig,
} from "@/lib/workout-utils";
import type { Workout, WorkoutLogSummary } from "./plan-detail";

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

export default function WorkoutReviewPanel({
  workout,
  log,
  onClose,
}: {
  workout: Workout;
  log: WorkoutLogSummary;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  const typeCfg =
    workoutTypeConfig[workout.workoutType] || workoutTypeConfig.EASY;
  const intCfg = intensityConfig[workout.intensity];

  // Fetch comments on mount
  useEffect(() => {
    async function fetchComments() {
      try {
        const res = await fetch(`/api/workout-logs/${log.id}/comments`);
        if (res.ok) {
          const data = await res.json();
          setComments(data);
        }
      } catch {
        // silently fail
      }
      setLoading(false);
    }
    fetchComments();
  }, [log.id]);

  const handlePostComment = useCallback(async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/workout-logs/${log.id}/comments`, {
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
    setPosting(false);
  }, [log.id, newComment]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[420px] max-w-full bg-white shadow-xl z-50 flex flex-col border-l border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold text-lg">Workout Review</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Workout info */}
          <div>
            <div className="text-xs text-gray-500 mb-1">
              {new Date(workout.date).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
            <h3 className="font-semibold text-base mb-2">{workout.title}</h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
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
          </div>

          {/* Planned vs Actual comparison */}
          <div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              Planned vs Actual
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-1 font-medium text-xs">Metric</th>
                  <th className="pb-1 font-medium text-xs">Planned</th>
                  <th className="pb-1 font-medium text-xs">Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(workout.distanceKm || log.actualDistanceKm) && (
                  <tr>
                    <td className="py-1.5 text-gray-600">Distance</td>
                    <td className="py-1.5">
                      {workout.distanceKm
                        ? `${parseFloat(workout.distanceKm)} km`
                        : "—"}
                    </td>
                    <td className="py-1.5 font-medium">
                      {log.actualDistanceKm
                        ? `${parseFloat(log.actualDistanceKm)} km`
                        : "—"}
                    </td>
                  </tr>
                )}
                {(workout.targetPace || log.actualPace) && (
                  <tr>
                    <td className="py-1.5 text-gray-600">Pace</td>
                    <td className="py-1.5">
                      {workout.targetPace
                        ? `${workout.targetPace} min/km`
                        : "—"}
                    </td>
                    <td className="py-1.5 font-medium">
                      {log.actualPace ? `${log.actualPace} min/km` : "—"}
                    </td>
                  </tr>
                )}
                {(workout.durationMin || log.actualDurationMin) && (
                  <tr>
                    <td className="py-1.5 text-gray-600">Duration</td>
                    <td className="py-1.5">
                      {workout.durationMin
                        ? `${workout.durationMin} min`
                        : "—"}
                    </td>
                    <td className="py-1.5 font-medium">
                      {log.actualDurationMin
                        ? `${log.actualDurationMin} min`
                        : "—"}
                    </td>
                  </tr>
                )}
                {log.avgHeartRate && (
                  <tr>
                    <td className="py-1.5 text-gray-600">Heart Rate</td>
                    <td className="py-1.5">—</td>
                    <td className="py-1.5 font-medium">
                      {log.avgHeartRate} bpm
                    </td>
                  </tr>
                )}
                {log.rpe && (
                  <tr>
                    <td className="py-1.5 text-gray-600">RPE</td>
                    <td className="py-1.5">—</td>
                    <td className="py-1.5 font-medium">{log.rpe}/10</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Runner notes */}
          {log.runnerNotes && (
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                Runner Notes
              </div>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-md p-3 whitespace-pre-wrap">
                {log.runnerNotes}
              </p>
            </div>
          )}

          {/* Comments */}
          <div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              Comments ({comments.length})
            </div>

            {loading && (
              <p className="text-sm text-gray-400">Loading comments...</p>
            )}

            <div className="space-y-2 mb-3">
              {comments.map((c) => {
                const isCoach = c.author.role === "COACH";
                return (
                  <div
                    key={c.id}
                    className={`rounded-md p-2.5 text-sm ${
                      isCoach
                        ? "bg-blue-50 border border-blue-100"
                        : "bg-gray-50 border border-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-gray-800 text-xs">
                        {c.author.name}
                      </span>
                      {isCoach && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5">
                          Coach
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap text-xs">
                      {c.content}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Comment input - fixed at bottom */}
        <div className="border-t border-gray-200 p-4">
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
              disabled={posting || !newComment.trim()}
              className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {posting ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
