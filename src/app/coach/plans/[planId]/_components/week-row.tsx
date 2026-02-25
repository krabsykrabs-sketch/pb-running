"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { workoutTypeConfig, activityLabels } from "@/lib/workout-utils";
import WorkoutForm from "./workout-form";
import WorkoutReviewPanel from "./workout-review-panel";
import type { Week, Workout, CatalogueSession, WorkoutLogSummary } from "./plan-detail";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const WEEK_TYPES = ["Build", "Low", "Moderate", "High", "Taper", "Race Week"] as const;

const weekTypeColor: Record<string, string> = {
  Build: "text-blue-700",
  Low: "text-green-700",
  Moderate: "text-yellow-700",
  High: "text-red-700",
  Taper: "text-purple-700",
  "Race Week": "text-orange-700",
};

export default function WeekRow({
  week,
  catalogueSessions,
  logsByWorkoutId,
}: {
  week: Week;
  catalogueSessions: CatalogueSession[];
  logsByWorkoutId: Record<string, WorkoutLogSummary>;
}) {
  const router = useRouter();
  const [editingDayIdx, setEditingDayIdx] = useState<number | null>(null);
  const [editingSidebar, setEditingSidebar] = useState(false);
  const [reviewWorkout, setReviewWorkout] = useState<Workout | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    targetKm: week.targetKm ? Math.round(parseFloat(week.targetKm)).toString() : "",
    weekType: week.weekIntensity || "",
    coachWeekNote: week.coachWeekNote || "",
  });

  // Build a map of day index (0=Mon, 6=Sun) → workout
  const workoutsByDay = new Map<number, Workout>();
  week.workouts.forEach((w) => {
    const d = new Date(w.date);
    const dayOfWeek = d.getUTCDay();
    const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    workoutsByDay.set(idx, w);
  });

  async function handleSaveSidebar() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/blocks/${week.blockId}/weeks/${week.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetKm: form.targetKm ? parseInt(form.targetKm) : null,
          weekIntensity: form.weekType || null,
          coachWeekNote: form.coachWeekNote || null,
        }),
      });
      if (!res.ok) {
        try {
          const data = await res.json();
          setError(data.error || "Failed to save");
        } catch {
          setError(`Failed to save (${res.status})`);
        }
        setSaving(false);
        return;
      }
      setEditingSidebar(false);
      router.refresh();
    } catch {
      setError("Failed to save");
    }
    setSaving(false);
  }

  // Computed summary values
  const scheduledKm = week.workouts
    .filter((w) => w.activity === "RUN" && w.distanceKm)
    .reduce((sum, w) => sum + parseFloat(w.distanceKm!), 0);
  const sessionCount = week.workouts.filter(
    (w) => w.workoutType !== "REST"
  ).length;
  const plannedKm = week.targetKm ? Math.round(parseFloat(week.targetKm)) : null;
  const currentType = week.weekIntensity || "";

  const sidebarInputClass =
    "w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent";

  return (
    <div>
      {/* Week header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="font-medium text-sm">Week {week.weekNumber}</span>
        <span className="text-xs text-gray-500">
          {new Date(week.startDate).toLocaleDateString()}
        </span>
        {currentType && (
          <span className={`text-xs font-medium ${weekTypeColor[currentType] || "text-gray-600"}`}>
            {currentType}
          </span>
        )}
      </div>

      {error && (
        <div className="mx-4 mb-2 bg-red-50 text-red-600 text-sm rounded-md p-3">
          {error}
        </div>
      )}

      {/* 7-day calendar grid + summary */}
      <div className="px-4 pb-3">
        <div className="flex gap-3">
          <div className="flex-1 grid grid-cols-7 gap-1">
            {DAY_LABELS.map((day, idx) => {
              const workout = workoutsByDay.get(idx);
              const typeCfg = workout
                ? workoutTypeConfig[workout.workoutType] ||
                  workoutTypeConfig.EASY
                : workoutTypeConfig.REST;

              const dayDate = new Date(week.startDate);
              dayDate.setUTCDate(dayDate.getUTCDate() + idx);
              const dateStr = dayDate.getUTCDate().toString();
              const isSelected = editingDayIdx === idx;

              const log = workout ? logsByWorkoutId[workout.id] : undefined;

              return (
                <div
                  key={idx}
                  onClick={() =>
                    setEditingDayIdx(isSelected ? null : idx)
                  }
                  className={`border rounded-md p-2 min-h-[80px] cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all ${
                    isSelected
                      ? "ring-2 ring-blue-500 border-blue-500"
                      : log?.completed
                        ? "bg-green-50 border-green-200"
                        : workout?.workoutType === "REST"
                          ? "bg-gray-50 border-gray-200"
                          : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500">
                      {day} {dateStr}
                    </span>
                    {log && (
                      <span
                        className={`text-[10px] font-medium px-1 rounded ${
                          log.completed
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {log.completed ? "Logged" : "Partial"}
                      </span>
                    )}
                  </div>
                  {workout && (
                    <div>
                      <div className="flex items-center gap-1 mb-0.5">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: typeCfg.color }}
                        />
                        <span className="text-xs font-medium truncate">
                          {workout.title || activityLabels[workout.activity] || workout.activity}
                        </span>
                      </div>
                      {workout.workoutType !== "REST" && (
                        <div className="text-xs text-gray-500 space-y-0.5">
                          {workout.distanceKm && (
                            <div>{parseFloat(workout.distanceKm)} km</div>
                          )}
                          {workout.targetPace && (
                            <div>{workout.targetPace} min/km</div>
                          )}
                          {workout.durationMin && (
                            <div>{workout.durationMin} min</div>
                          )}
                          {workout.details && (
                            <div className="text-gray-400 line-clamp-2">{workout.details}</div>
                          )}
                        </div>
                      )}
                      {log && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReviewWorkout(workout);
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-700 mt-1"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Week summary sidebar */}
          <div className="w-36 flex-shrink-0 bg-gray-50 rounded-md border border-gray-200 p-3 text-xs space-y-2">
            {editingSidebar ? (
              <>
                <div>
                  <label className="text-gray-500 block mb-0.5">Type</label>
                  <select
                    value={form.weekType}
                    onChange={(e) => setForm({ ...form, weekType: e.target.value })}
                    className={sidebarInputClass}
                  >
                    <option value="">—</option>
                    {WEEK_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-500 block mb-0.5">Planned km</label>
                  <input
                    type="number"
                    value={form.targetKm}
                    onChange={(e) => setForm({ ...form, targetKm: e.target.value })}
                    className={sidebarInputClass}
                    step="1"
                    placeholder="—"
                  />
                </div>
                <div>
                  <label className="text-gray-500 block mb-0.5">Coach Note</label>
                  <textarea
                    value={form.coachWeekNote}
                    onChange={(e) => setForm({ ...form, coachWeekNote: e.target.value })}
                    className={sidebarInputClass}
                    rows={2}
                    placeholder="Weekly note..."
                  />
                </div>
                <div className="flex gap-1 pt-1">
                  <button
                    onClick={handleSaveSidebar}
                    disabled={saving}
                    className="flex-1 bg-blue-600 text-white rounded px-2 py-1 text-xs hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingSidebar(false);
                      setForm({
                        targetKm: week.targetKm ? Math.round(parseFloat(week.targetKm)).toString() : "",
                        weekType: week.weekIntensity || "",
                        coachWeekNote: week.coachWeekNote || "",
                      });
                    }}
                    className="flex-1 border border-gray-300 text-gray-600 rounded px-2 py-1 text-xs hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-gray-500">Type</span>
                  <div className={`font-medium text-sm ${weekTypeColor[currentType] || ""}`}>
                    {currentType || "—"}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Planned km</span>
                  <div className="font-medium text-sm">
                    {plannedKm != null ? `${plannedKm} km` : "—"}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Scheduled km</span>
                  <div className="font-medium text-sm">
                    {scheduledKm > 0 ? `${Math.round(scheduledKm)} km` : "—"}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Sessions</span>
                  <div className="font-medium text-sm">
                    {sessionCount} scheduled
                  </div>
                </div>
                {week.coachWeekNote && (
                  <div>
                    <span className="text-gray-500">Coach Note</span>
                    <div className="text-sm text-blue-600 whitespace-pre-wrap break-words">
                      {week.coachWeekNote}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setEditingSidebar(true)}
                  className="text-blue-600 hover:text-blue-700 text-xs pt-1"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>

        {/* Workout form below grid */}
        {editingDayIdx !== null && (() => {
          const workout = workoutsByDay.get(editingDayIdx);
          const dayDate = new Date(week.startDate);
          dayDate.setUTCDate(dayDate.getUTCDate() + editingDayIdx);
          const isoDate = dayDate.toISOString().split("T")[0];
          return (
            <div className="mt-2">
              <WorkoutForm
                key={`${editingDayIdx}-${workout?.id || "new"}`}
                weekId={week.id}
                date={isoDate}
                catalogueSessions={catalogueSessions}
                initial={workout}
                onSave={() => {
                  setEditingDayIdx(null);
                  router.refresh();
                }}
                onCancel={() => setEditingDayIdx(null)}
              />
            </div>
          );
        })()}

      </div>

      {/* Workout review slide-over panel */}
      {reviewWorkout && logsByWorkoutId[reviewWorkout.id] && (
        <WorkoutReviewPanel
          workout={reviewWorkout}
          log={logsByWorkoutId[reviewWorkout.id]}
          onClose={() => setReviewWorkout(null)}
        />
      )}
    </div>
  );
}
