"use client";

import { useState } from "react";
import {
  workoutTypeConfig,
  activityLabels,
  intensityConfig,
} from "@/lib/workout-utils";
import type { CatalogueSession, Workout } from "./plan-detail";

const WORKOUT_TYPES = Object.keys(workoutTypeConfig);
const ACTIVITIES = Object.keys(activityLabels);
const INTENSITIES = Object.keys(intensityConfig);

const emptyForm = {
  title: "",
  workoutType: "",
  activity: "RUN",
  distanceKm: "",
  targetPace: "",
  durationMin: "",
  intensity: "",
  details: "",
  coachNotes: "",
  nutrition: "",
  catalogueSessionId: "",
};

function formatDateHeader(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export default function WorkoutForm({
  weekId,
  date,
  catalogueSessions,
  onSave,
  onCancel,
  initial,
}: {
  weekId: string;
  date: string;
  catalogueSessions: CatalogueSession[];
  onSave: () => void;
  onCancel: () => void;
  initial?: Workout;
}) {
  const isEdit = !!initial;
  const isRestWorkout = initial?.workoutType === "REST";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(
    initial && !isRestWorkout
      ? {
          title: initial.title,
          workoutType: initial.workoutType,
          activity: initial.activity,
          distanceKm: initial.distanceKm || "",
          targetPace: initial.targetPace || "",
          durationMin: initial.durationMin?.toString() || "",
          intensity: initial.intensity,
          details: initial.details,
          coachNotes: initial.coachNotes || "",
          nutrition: initial.nutrition || "",
          catalogueSessionId: initial.catalogueSessionId || "",
        }
      : emptyForm
  );

  // Filter catalogue sessions by activity (REST hides catalogue)
  const showCatalogue = form.activity !== "REST";
  const filteredCatalogue = showCatalogue
    ? catalogueSessions.filter((s) => s.activity === form.activity)
    : [];

  function handleActivityChange(activity: string) {
    setForm({ ...form, activity, catalogueSessionId: "" });
  }

  function handleCatalogueSelect(sessionId: string) {
    if (!sessionId) {
      setForm({ ...form, catalogueSessionId: "" });
      return;
    }
    const session = catalogueSessions.find((s) => s.id === sessionId);
    if (session) {
      setForm({
        ...form,
        catalogueSessionId: sessionId,
        title: session.name,
        activity: session.activity,
        workoutType: session.workoutType || "",
        distanceKm: session.distanceKm || "",
        targetPace: session.targetPace || "",
        durationMin: session.durationMin?.toString() || "",
        intensity: session.intensity || "",
        details: session.details,
        coachNotes: session.coachNotes || "",
        nutrition: session.nutrition || "",
      });
    }
  }

  async function handleSubmit() {
    if (!form.activity) {
      setError("Activity is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url = isEdit && !isRestWorkout
        ? `/api/weeks/${weekId}/workouts/${initial.id}`
        : `/api/weeks/${weekId}/workouts`;
      const method = isEdit && !isRestWorkout ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          activity: form.activity,
          title: form.title || null,
          workoutType: form.workoutType || null,
          intensity: form.intensity || null,
          details: form.details || null,
          distanceKm: form.distanceKm ? parseFloat(form.distanceKm as string) : null,
          targetPace: form.targetPace || null,
          durationMin: form.durationMin ? parseInt(form.durationMin as string) : null,
          catalogueSessionId: form.catalogueSessionId || null,
          coachNotes: form.coachNotes || null,
          nutrition: form.nutrition || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save workout");
        setSaving(false);
        return;
      }
      onSave();
    } catch {
      setError("Failed to save workout");
    }
    setSaving(false);
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-3">
      {/* Date header */}
      <div className="text-sm font-medium text-gray-700">
        {formatDateHeader(date)}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-md p-2">
          {error}
        </div>
      )}

      {/* Activity */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Activity *</label>
        <select
          value={form.activity}
          onChange={(e) => handleActivityChange(e.target.value)}
          className={inputClass}
        >
          {ACTIVITIES.map((a) => (
            <option key={a} value={a}>
              {activityLabels[a]}
            </option>
          ))}
        </select>
      </div>

      {/* From Catalogue — hidden only for REST */}
      {showCatalogue && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            From Catalogue
          </label>
          <select
            value={form.catalogueSessionId}
            onChange={(e) => handleCatalogueSelect(e.target.value)}
            className={inputClass}
          >
            <option value="">From scratch</option>
            {filteredCatalogue.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({activityLabels[s.activity]}{s.durationMin ? `, ${s.durationMin} min` : ""})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Title + Type */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputClass}
            placeholder="e.g. Easy 5K"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Type</label>
          <select
            value={form.workoutType}
            onChange={(e) =>
              setForm({ ...form, workoutType: e.target.value })
            }
            className={inputClass}
          >
            <option value="">—</option>
            {WORKOUT_TYPES.map((t) => (
              <option key={t} value={t}>
                {workoutTypeConfig[t].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Distance, Target Pace, Duration, Intensity */}
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Distance (km)
          </label>
          <input
            type="number"
            value={form.distanceKm}
            onChange={(e) =>
              setForm({ ...form, distanceKm: e.target.value })
            }
            className={inputClass}
            step="0.1"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Target pace min/km
          </label>
          <input
            type="text"
            value={form.targetPace}
            onChange={(e) =>
              setForm({ ...form, targetPace: e.target.value })
            }
            className={inputClass}
            placeholder="e.g. 5:30/km"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Duration (min)
          </label>
          <input
            type="number"
            value={form.durationMin}
            onChange={(e) =>
              setForm({ ...form, durationMin: e.target.value })
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Intensity
          </label>
          <select
            value={form.intensity}
            onChange={(e) =>
              setForm({ ...form, intensity: e.target.value })
            }
            className={inputClass}
          >
            <option value="">—</option>
            {INTENSITIES.map((i) => (
              <option key={i} value={i}>
                {intensityConfig[i].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Details */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Details</label>
        <textarea
          value={form.details}
          onChange={(e) => setForm({ ...form, details: e.target.value })}
          className={inputClass}
          rows={2}
          placeholder="Workout details..."
        />
      </div>

      {/* Coach Notes + Nutrition */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Coach Notes
          </label>
          <textarea
            value={form.coachNotes}
            onChange={(e) =>
              setForm({ ...form, coachNotes: e.target.value })
            }
            className={inputClass}
            rows={1}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Nutrition
          </label>
          <textarea
            value={form.nutrition}
            onChange={(e) =>
              setForm({ ...form, nutrition: e.target.value })
            }
            className={inputClass}
            rows={1}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-blue-600 text-white rounded-md px-3 py-1.5 text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "..." : isEdit && !isRestWorkout ? "Save" : "Add Workout"}
        </button>
        <button
          onClick={onCancel}
          className="border border-gray-300 text-gray-700 rounded-md px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
