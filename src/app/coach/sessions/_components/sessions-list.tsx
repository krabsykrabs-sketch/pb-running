"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  workoutTypeConfig,
  activityLabels,
  intensityConfig,
} from "@/lib/workout-utils";

type Session = {
  id: string;
  name: string;
  activity: string;
  workoutType: string | null;
  distanceKm: string | null;
  targetPace: string | null;
  durationMin: number | null;
  intensity: string | null;
  details: string;
  coachNotes: string | null;
  nutrition: string | null;
  isPbRunning: boolean;
  _count: { workouts: number };
};

const ACTIVITIES = Object.keys(activityLabels);
const WORKOUT_TYPES = Object.keys(workoutTypeConfig);
const INTENSITIES = Object.keys(intensityConfig);

const emptyForm = {
  name: "",
  activity: "SC" as string,
  workoutType: "" as string,
  distanceKm: "",
  targetPace: "",
  durationMin: "",
  intensity: "" as string,
  details: "",
  nutrition: "",
};

export default function SessionsList({ sessions }: { sessions: Session[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  function resetForm() {
    setForm(emptyForm);
  }

  function startEdit(s: Session) {
    setEditingId(s.id);
    setForm({
      name: s.name,
      activity: s.activity,
      workoutType: s.workoutType || "",
      distanceKm: s.distanceKm || "",
      targetPace: s.targetPace || "",
      durationMin: s.durationMin?.toString() || "",
      intensity: s.intensity || "",
      details: s.details,
      nutrition: s.nutrition || "",
    });
    setShowAdd(false);
  }

  async function handleAdd() {
    if (!form.name || !form.activity) {
      setError("Name and activity are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          activity: form.activity,
          workoutType: form.workoutType || null,
          distanceKm: form.distanceKm ? parseFloat(form.distanceKm) : null,
          targetPace: form.targetPace || null,
          durationMin: form.durationMin ? parseInt(form.durationMin) : null,
          intensity: form.intensity || null,
          details: form.details || "",
          nutrition: form.nutrition || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add session");
        setSaving(false);
        return;
      }
      setShowAdd(false);
      resetForm();
      router.refresh();
    } catch {
      setError("Failed to add session");
    }
    setSaving(false);
  }

  async function handleUpdate() {
    if (!editingId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/sessions/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          activity: form.activity,
          workoutType: form.workoutType || null,
          distanceKm: form.distanceKm ? parseFloat(form.distanceKm) : null,
          targetPace: form.targetPace || null,
          durationMin: form.durationMin ? parseInt(form.durationMin) : null,
          intensity: form.intensity || null,
          details: form.details,
          nutrition: form.nutrition || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update session");
        setSaving(false);
        return;
      }
      setEditingId(null);
      resetForm();
      router.refresh();
    } catch {
      setError("Failed to update session");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this session? Workouts using it will keep their data but lose the catalogue link.")) return;
    try {
      await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      router.refresh();
    } catch {
      setError("Failed to delete session");
    }
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  function renderForm(onSubmit: () => void, submitLabel: string) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        {/* Row 1: Name + Activity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="e.g. Core Strength Circuit"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Activity *</label>
            <select
              value={form.activity}
              onChange={(e) => setForm({ ...form, activity: e.target.value })}
              className={inputClass}
            >
              {ACTIVITIES.map((a) => (
                <option key={a} value={a}>
                  {activityLabels[a]}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Row 2: Type + Distance + Target Pace + Duration + Intensity */}
        <div className="grid grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select
              value={form.workoutType}
              onChange={(e) => setForm({ ...form, workoutType: e.target.value })}
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
          <div>
            <label className="block text-xs text-gray-500 mb-1">Distance (km)</label>
            <input
              type="number"
              value={form.distanceKm}
              onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
              className={inputClass}
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Target pace min/km</label>
            <input
              type="text"
              value={form.targetPace}
              onChange={(e) => setForm({ ...form, targetPace: e.target.value })}
              className={inputClass}
              placeholder="e.g. 5:30/km"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Duration (min)</label>
            <input
              type="number"
              value={form.durationMin}
              onChange={(e) => setForm({ ...form, durationMin: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Intensity</label>
            <select
              value={form.intensity}
              onChange={(e) => setForm({ ...form, intensity: e.target.value })}
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
        {/* Row 3: Details */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Details</label>
          <textarea
            value={form.details}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
            className={inputClass}
            rows={2}
            placeholder="What this session involves..."
          />
        </div>
        {/* Row 4: Nutrition */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Nutrition</label>
          <textarea
            value={form.nutrition}
            onChange={(e) => setForm({ ...form, nutrition: e.target.value })}
            className={inputClass}
            rows={1}
          />
        </div>
        {/* Row 5: Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onSubmit}
            disabled={saving}
            className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "..." : submitLabel}
          </button>
          <button
            onClick={() => {
              setShowAdd(false);
              setEditingId(null);
              resetForm();
            }}
            className="border border-gray-300 text-gray-700 rounded-md px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Session Catalogue</h1>
          <p className="text-sm text-gray-500 mt-1">
            Cross-training and S&C sessions to use in training plans
          </p>
        </div>
        {!showAdd && !editingId && (
          <button
            onClick={() => {
              resetForm();
              setShowAdd(true);
            }}
            className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm hover:bg-blue-700"
          >
            + Add Session
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-md p-3 mb-4">
          {error}
        </div>
      )}

      {showAdd && (
        <div className="mb-4">
          {renderForm(handleAdd, "Add")}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Activity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Duration
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Used
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sessions.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  No sessions in catalogue yet
                </td>
              </tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.id}>
                  {editingId === s.id ? (
                    <td colSpan={6} className="p-2">
                      {renderForm(handleUpdate, "Save")}
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-sm font-medium">
                        {s.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {activityLabels[s.activity] || s.activity}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {s.workoutType ? (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              workoutTypeConfig[s.workoutType]?.bgClass || "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {workoutTypeConfig[s.workoutType]?.label || s.workoutType}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {s.durationMin ? `${s.durationMin} min` : "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500">
                        {s._count.workouts}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <button
                          onClick={() => startEdit(s)}
                          className="text-blue-600 hover:text-blue-700 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
