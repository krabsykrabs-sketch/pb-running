"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { planStatusConfig } from "@/lib/workout-utils";

type Plan = {
  [key: string]: unknown;
  _count: { blocks: number };
};

const emptyForm = {
  name: "",
  goal: "",
  startDate: "",
  raceDate: "",
};

function weeksUntilRace(startDate: string, raceDate: string): number | null {
  if (!startDate || !raceDate) return null;
  const start = new Date(startDate);
  const race = new Date(raceDate);
  const diff = race.getTime() - start.getTime();
  if (diff <= 0) return null;
  return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
}

export default function PlansTab({
  runnerId,
  plans,
}: {
  runnerId: string;
  plans: Plan[];
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  function resetForm() {
    setForm(emptyForm);
  }

  async function handleAdd() {
    if (!form.name || !form.goal || !form.startDate) {
      setError("Name, goal, and start date are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/runners/${runnerId}/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create plan");
        setSaving(false);
        return;
      }
      setShowAdd(false);
      resetForm();
      router.refresh();
    } catch {
      setError("Failed to create plan");
    }
    setSaving(false);
  }

  async function handleDelete(planId: string) {
    if (!confirm("Delete this plan and all its blocks, weeks, and workouts?"))
      return;
    try {
      await fetch(`/api/plans/${planId}`, { method: "DELETE" });
      router.refresh();
    } catch {
      setError("Failed to delete plan");
    }
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  const statusOrder: Record<string, number> = { ACTIVE: 0, DRAFT: 1, COMPLETED: 2 };
  const sortedPlans = [...plans].sort(
    (a, b) =>
      (statusOrder[a.status as string] ?? 9) -
      (statusOrder[b.status as string] ?? 9)
  );

  const weeksHint = weeksUntilRace(form.startDate, form.raceDate);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Training Plans</h2>
        {!showAdd && (
          <button
            onClick={() => {
              resetForm();
              setShowAdd(true);
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Create Plan
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
                Plan Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="e.g. Dublin Marathon 2026"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Goal *
              </label>
              <input
                type="text"
                value={form.goal}
                onChange={(e) => setForm({ ...form, goal: e.target.value })}
                className={inputClass}
                placeholder="e.g. Sub-3:30 marathon"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Race Date (optional)
              </label>
              <input
                type="date"
                value={form.raceDate}
                onChange={(e) =>
                  setForm({ ...form, raceDate: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>
          {weeksHint !== null && (
            <p className="text-sm text-blue-600">
              {weeksHint} week{weeksHint !== 1 ? "s" : ""} until race day
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "..." : "Create Plan"}
            </button>
            <button
              onClick={() => {
                setShowAdd(false);
                resetForm();
              }}
              className="border border-gray-300 text-gray-700 rounded-md px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {sortedPlans.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-sm text-gray-500">
          No training plans yet
        </div>
      ) : (
        <div className="space-y-3">
          {sortedPlans.map((plan) => {
            const id = plan.id as string;
            const status = plan.status as string;
            const statusCfg = planStatusConfig[status] || planStatusConfig.DRAFT;
            return (
              <div
                key={id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/coach/plans/${id}`}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {plan.name as string}
                      </Link>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.bgClass}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{plan.goal as string}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>
                        Start: {new Date(plan.startDate as string).toLocaleDateString()}
                      </span>
                      {plan.raceDate ? (
                        <span>
                          Race:{" "}
                          {new Date(plan.raceDate as string).toLocaleDateString()}
                        </span>
                      ) : null}
                      <span>
                        {plan._count.blocks} block
                        {plan._count.blocks !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/coach/plans/${id}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(id)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
