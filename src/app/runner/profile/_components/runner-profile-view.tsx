"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Runner = Record<string, unknown> & {
  id: string;
  name: string;
  email: string;
  profile: Record<string, unknown> | null;
  nutritionPlan: Record<string, unknown> | null;
  personalBests: Record<string, unknown>[];
  goals: Record<string, unknown>[];
  healthLogsAsRunner: (Record<string, unknown> & { author: { name: string } })[];
};

const goalStatusColors: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-800",
  ACHIEVED: "bg-green-100 text-green-800",
  ABANDONED: "bg-gray-100 text-gray-600",
};

const severityColors: Record<string, string> = {
  MINOR: "bg-green-100 text-green-800",
  MODERATE: "bg-yellow-100 text-yellow-800",
  SEVERE: "bg-red-100 text-red-800",
};

const healthStatusColors: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-gray-100 text-gray-600",
};

export default function RunnerProfileView({ runner }: { runner: Runner }) {
  const p = runner.profile;

  return (
    <div className="space-y-6 pb-24">
      <h1 className="text-xl font-bold">My Profile</h1>

      {/* Profile Info */}
      <ProfileSection profile={p} runner={runner} />

      {/* Personal Bests */}
      <PBsSection personalBests={runner.personalBests} />

      {/* Goals */}
      <GoalsSection goals={runner.goals} />

      {/* Health Log */}
      <HealthSection
        runnerId={runner.id}
        healthLogs={runner.healthLogsAsRunner}
      />

      {/* Nutrition */}
      <NutritionSection nutritionPlan={runner.nutritionPlan} />
    </div>
  );
}

/* ── Profile Info ─────────────────────────────────────────────── */

function ProfileSection({
  profile: p,
  runner,
}: {
  profile: Record<string, unknown> | null;
  runner: Runner;
}) {
  const readonlyClass =
    "rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-700";
  const labelClass = "block text-xs text-gray-500 mb-1";

  function Field({ label, value }: { label: string; value: unknown }) {
    const display =
      value !== null && value !== undefined && value !== ""
        ? String(value)
        : "—";
    return (
      <div>
        <label className={labelClass}>{label}</label>
        <div className={readonlyClass}>{display}</div>
      </div>
    );
  }

  function CheckField({ label, checked }: { label: string; checked: boolean }) {
    return (
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          disabled
          className="rounded border-gray-300 text-blue-600"
        />
        <span className="text-sm text-gray-700">{label}</span>
      </label>
    );
  }

  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-5">
      <h2 className="text-lg font-semibold">Profile</h2>

      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">Personal</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Name" value={runner.name} />
          <Field label="Email" value={runner.email} />
          <Field label="Phone" value={p?.phone} />
          <Field label="Age" value={p?.age} />
          <Field label="Gender" value={p?.gender} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">
          Running Background
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Years Running" value={p?.yearsRunning} />
          <Field label="Current Weekly Km" value={p?.currentWeeklyKm} />
          <Field label="Recent Races" value={p?.recentRaces} />
          <Field label="Previous Coaching" value={p?.previousCoaching} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">Goal Race</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Goal Race" value={p?.goalRace} />
          <Field
            label="Goal Race Date"
            value={
              p?.goalRaceDate
                ? new Date(p.goalRaceDate as string).toLocaleDateString()
                : null
            }
          />
          <Field label="Goal Time" value={p?.goalTime} />
          <Field label="Goal Priority" value={p?.goalPriority} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">
          Availability
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Training Days/Week" value={p?.trainingDaysPerWeek} />
          <Field
            label="Max Session Length (min)"
            value={p?.maxSessionLengthMin}
          />
          <Field label="Preferred Days" value={p?.preferredDays} />
          <Field label="Preferred Time of Day" value={p?.preferredTimeOfDay} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">Equipment</h3>
        <div className="flex flex-wrap gap-6">
          <CheckField
            label="HR Monitor"
            checked={(p?.hasHrMonitor as boolean) || false}
          />
          <CheckField
            label="Gym Access"
            checked={(p?.hasGymAccess as boolean) || false}
          />
          <CheckField
            label="Track Access"
            checked={(p?.hasTrackAccess as boolean) || false}
          />
        </div>
      </div>

      {Boolean(p?.chronicConditions || p?.medications) && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">Health</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Chronic Conditions" value={p?.chronicConditions} />
            <Field label="Medications" value={p?.medications} />
          </div>
        </div>
      )}
    </section>
  );
}

/* ── Personal Bests ───────────────────────────────────────────── */

function PBsSection({
  personalBests,
}: {
  personalBests: Record<string, unknown>[];
}) {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <h2 className="text-lg font-semibold mb-4">Personal Bests</h2>

      {personalBests.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">
          No personal bests recorded yet.
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Distance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Race
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {personalBests.map((pb) => (
                  <tr key={pb.id as string}>
                    <td className="px-4 py-3 text-sm font-medium">
                      {pb.distance as string}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {pb.time as string}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {(pb.raceName as string) || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(pb.date as string).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {personalBests.map((pb) => (
              <div
                key={pb.id as string}
                className="bg-gray-50 rounded-lg p-3 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium">
                    {pb.distance as string}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(pb.raceName as string) || "—"} &middot;{" "}
                    {new Date(pb.date as string).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm font-semibold">
                  {pb.time as string}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="text-xs text-gray-400 mt-3">
        Personal bests are managed by your coach.
      </p>
    </section>
  );
}

/* ── Goals ─────────────────────────────────────────────────────── */

function GoalsSection({ goals }: { goals: Record<string, unknown>[] }) {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <h2 className="text-lg font-semibold mb-4">Goals</h2>

      {goals.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">
          No goals set yet.
        </p>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <div
              key={goal.id as string}
              className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${goalStatusColors[goal.status as string] || ""}`}
                >
                  {goal.status as string}
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {goal.description as string}
                  </p>
                  <p className="text-xs text-gray-500">
                    Target:{" "}
                    {new Date(
                      goal.targetDate as string
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Health Log ────────────────────────────────────────────────── */

function HealthSection({
  runnerId,
  healthLogs,
}: {
  runnerId: string;
  healthLogs: (Record<string, unknown> & { author: { name: string } })[];
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    description: "",
    bodyPart: "",
    severity: "MINOR",
    date: new Date().toISOString().split("T")[0],
    status: "ACTIVE",
  });

  function resetForm() {
    setForm({
      description: "",
      bodyPart: "",
      severity: "MINOR",
      date: new Date().toISOString().split("T")[0],
      status: "ACTIVE",
    });
  }

  async function handleAdd() {
    if (!form.description || !form.bodyPart) {
      setError("Description and body part are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/runners/${runnerId}/health`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add entry");
        setSaving(false);
        return;
      }
      setShowAdd(false);
      resetForm();
      router.refresh();
    } catch {
      setError("Failed to add entry");
    }
    setSaving(false);
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Health Log</h2>
        {!showAdd && (
          <button
            onClick={() => {
              resetForm();
              setShowAdd(true);
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Add Entry
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-md p-3 mb-4">
          {error}
        </div>
      )}

      {showAdd && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Body Part *
              </label>
              <input
                type="text"
                value={form.bodyPart}
                onChange={(e) =>
                  setForm({ ...form, bodyPart: e.target.value })
                }
                className={inputClass}
                placeholder="e.g. Left Knee"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Severity *
              </label>
              <select
                value={form.severity}
                onChange={(e) =>
                  setForm({ ...form, severity: e.target.value })
                }
                className={inputClass}
              >
                <option value="MINOR">Minor</option>
                <option value="MODERATE">Moderate</option>
                <option value="SEVERE">Severe</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Description *
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className={inputClass}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value })
                }
                className={inputClass}
              >
                <option value="ACTIVE">Active</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="bg-blue-600 text-white rounded-md px-4 py-1.5 text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "..." : "Add Entry"}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="border border-gray-300 text-gray-700 rounded-md px-4 py-1.5 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {healthLogs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            No health entries yet.
          </p>
        ) : (
          healthLogs.map((log) => (
            <div
              key={log.id as string}
              className="bg-gray-50 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${severityColors[log.severity as string] || ""}`}
                  >
                    {log.severity as string}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${healthStatusColors[log.status as string] || ""}`}
                  >
                    {log.status as string}
                  </span>
                  <span className="text-sm font-medium">
                    {log.bodyPart as string}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(log.date as string).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {log.description as string}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Logged by {log.author.name}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

/* ── Nutrition ─────────────────────────────────────────────────── */

function NutritionSection({
  nutritionPlan,
}: {
  nutritionPlan: Record<string, unknown> | null;
}) {
  const readonlyClass =
    "w-full rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-700 min-h-[60px] whitespace-pre-wrap";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <h2 className="text-lg font-semibold mb-4">Nutrition Plan</h2>

      {!nutritionPlan ? (
        <p className="text-sm text-gray-500 text-center py-6">
          No nutrition plan set yet.
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>General Strategy</label>
            <div className={readonlyClass}>
              {(nutritionPlan.generalStrategy as string) || "—"}
            </div>
          </div>
          <div>
            <label className={labelClass}>Race Day Nutrition</label>
            <div className={readonlyClass}>
              {(nutritionPlan.raceDay as string) || "—"}
            </div>
          </div>
          <div>
            <label className={labelClass}>Supplements</label>
            <div className={readonlyClass}>
              {(nutritionPlan.supplements as string) || "—"}
            </div>
          </div>
          {Boolean(nutritionPlan.updatedAt) && (
            <p className="text-xs text-gray-400">
              Last updated:{" "}
              {new Date(
                nutritionPlan.updatedAt as string
              ).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3">
        Your nutrition plan is managed by your coach.
      </p>
    </section>
  );
}
