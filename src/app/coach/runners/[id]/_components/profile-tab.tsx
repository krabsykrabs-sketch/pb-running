"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Profile = Record<string, unknown> | null;

export default function ProfileTab({
  runnerId,
  profile,
}: {
  runnerId: string;
  profile: Profile;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    phone: (profile?.phone as string) || "",
    age: profile?.age?.toString() || "",
    gender: (profile?.gender as string) || "",
    yearsRunning: profile?.yearsRunning?.toString() || "",
    currentWeeklyKm: profile?.currentWeeklyKm?.toString() || "",
    recentRaces: (profile?.recentRaces as string) || "",
    previousCoaching: (profile?.previousCoaching as string) || "",
    goalRace: (profile?.goalRace as string) || "",
    goalRaceDate: profile?.goalRaceDate
      ? (profile.goalRaceDate as string).split("T")[0]
      : "",
    goalTime: (profile?.goalTime as string) || "",
    goalPriority: (profile?.goalPriority as string) || "",
    trainingDaysPerWeek: profile?.trainingDaysPerWeek?.toString() || "",
    preferredDays: (profile?.preferredDays as string) || "",
    preferredTimeOfDay: (profile?.preferredTimeOfDay as string) || "",
    maxSessionLengthMin: profile?.maxSessionLengthMin?.toString() || "",
    chronicConditions: (profile?.chronicConditions as string) || "",
    medications: (profile?.medications as string) || "",
    dietType: (profile?.dietType as string) || "",
    dietaryRestrictions: (profile?.dietaryRestrictions as string) || "",
    hydrationHabits: (profile?.hydrationHabits as string) || "",
    hasHrMonitor: (profile?.hasHrMonitor as boolean) || false,
    hasGymAccess: (profile?.hasGymAccess as boolean) || false,
    hasTrackAccess: (profile?.hasTrackAccess as boolean) || false,
    otherNotes: (profile?.otherNotes as string) || "",
    reviewIntervalDays: profile?.reviewIntervalDays?.toString() || "7",
  });

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/runners/${runnerId}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        setSaving(false);
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Failed to save");
    }
    setSaving(false);
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const readonlyClass =
    "w-full rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-700";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  function Field({
    label,
    field,
    type = "text",
  }: {
    label: string;
    field: string;
    type?: string;
  }) {
    return (
      <div>
        <label className={labelClass}>{label}</label>
        {editing ? (
          type === "textarea" ? (
            <textarea
              value={form[field as keyof typeof form] as string}
              onChange={(e) => updateField(field, e.target.value)}
              className={inputClass}
              rows={2}
            />
          ) : (
            <input
              type={type}
              value={form[field as keyof typeof form] as string}
              onChange={(e) => updateField(field, e.target.value)}
              className={inputClass}
            />
          )
        ) : (
          <div className={readonlyClass}>
            {(form[field as keyof typeof form] as string) || "—"}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Runner Profile</h2>
        {editing ? (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white rounded-md px-4 py-1.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="border border-gray-300 text-gray-700 rounded-md px-4 py-1.5 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-md p-3 mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Personal</h3>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Phone" field="phone" type="tel" />
            <Field label="Age" field="age" type="number" />
            {editing ? (
              <div>
                <label className={labelClass}>Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => updateField("gender", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            ) : (
              <Field label="Gender" field="gender" />
            )}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            Running Background
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Years Running"
              field="yearsRunning"
              type="number"
            />
            <Field
              label="Current Weekly Km"
              field="currentWeeklyKm"
              type="number"
            />
            <Field label="Recent Races" field="recentRaces" type="textarea" />
            <Field
              label="Previous Coaching"
              field="previousCoaching"
              type="textarea"
            />
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Goal</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Goal Race" field="goalRace" />
            <Field label="Goal Race Date" field="goalRaceDate" type="date" />
            <Field label="Goal Time" field="goalTime" />
            {editing ? (
              <div>
                <label className={labelClass}>Goal Priority</label>
                <select
                  value={form.goalPriority}
                  onChange={(e) => updateField("goalPriority", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select...</option>
                  <option value="FINISH">Finish</option>
                  <option value="TIME_GOAL">Time Goal</option>
                  <option value="ENJOY">Enjoy</option>
                </select>
              </div>
            ) : (
              <Field label="Goal Priority" field="goalPriority" />
            )}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            Availability
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Training Days/Week"
              field="trainingDaysPerWeek"
              type="number"
            />
            <Field
              label="Max Session Length (min)"
              field="maxSessionLengthMin"
              type="number"
            />
            <Field label="Preferred Days" field="preferredDays" />
            <Field
              label="Preferred Time of Day"
              field="preferredTimeOfDay"
            />
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Health</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Chronic Conditions"
              field="chronicConditions"
              type="textarea"
            />
            <Field label="Medications" field="medications" type="textarea" />
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            Diet & Hydration
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Diet Type" field="dietType" />
            <Field
              label="Dietary Restrictions"
              field="dietaryRestrictions"
            />
            <Field
              label="Hydration Habits"
              field="hydrationHabits"
              type="textarea"
            />
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            Equipment & Settings
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.hasHrMonitor}
                disabled={!editing}
                onChange={(e) => updateField("hasHrMonitor", e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">HR Monitor</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.hasGymAccess}
                disabled={!editing}
                onChange={(e) => updateField("hasGymAccess", e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Gym Access</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.hasTrackAccess}
                disabled={!editing}
                onChange={(e) =>
                  updateField("hasTrackAccess", e.target.checked)
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Track Access</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Field
              label="Review Interval (days)"
              field="reviewIntervalDays"
              type="number"
            />
            <Field label="Other Notes" field="otherNotes" type="textarea" />
          </div>
        </section>
      </div>
    </div>
  );
}
