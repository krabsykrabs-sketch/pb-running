"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { planStatusConfig } from "@/lib/workout-utils";
import BlockCard from "./block-card";

type CatalogueSession = {
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
};

type Workout = {
  id: string;
  weekId: string;
  date: string;
  title: string;
  workoutType: string;
  activity: string;
  distanceKm: string | null;
  targetPace: string | null;
  durationMin: number | null;
  intensity: string;
  details: string;
  coachNotes: string | null;
  nutrition: string | null;
  isPbRunning: boolean;
  catalogueSessionId: string | null;
  catalogueSession: CatalogueSession | null;
};

type Week = {
  id: string;
  blockId: string;
  weekNumber: number;
  startDate: string;
  description: string | null;
  targetKm: string | null;
  weekIntensity: string | null;
  pacesFocus: string | null;
  coachWeekNote: string | null;
  isPopulated: boolean;
  workouts: Workout[];
};

type Block = {
  id: string;
  planId: string;
  name: string;
  orderIndex: number;
  description: string;
  weeks: Week[];
};

type Plan = {
  id: string;
  runnerId: string;
  name: string;
  goal: string;
  raceDate: string | null;
  startDate: string;
  endDate: string;
  status: string;
  runner: { id: string; name: string };
  blocks: Block[];
};

const STATUSES = ["DRAFT", "ACTIVE", "COMPLETED"] as const;

export type WorkoutLogSummary = {
  id: string;
  workoutId: string;
  completed: boolean;
  actualDistanceKm: string | null;
  actualPace: string | null;
  actualDurationMin: number | null;
  avgHeartRate: number | null;
  rpe: number | null;
  runnerNotes: string | null;
  commentCount: number;
};

export default function PlanDetail({
  plan,
  catalogueSessions,
  logsByWorkoutId,
}: {
  plan: Plan;
  catalogueSessions: CatalogueSession[];
  logsByWorkoutId: Record<string, WorkoutLogSummary>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: plan.name,
    goal: plan.goal,
    raceDate: plan.raceDate ? plan.raceDate.split("T")[0] : "",
    startDate: plan.startDate.split("T")[0],
    endDate: plan.endDate.split("T")[0],
    status: plan.status,
  });
  const [addingBlock, setAddingBlock] = useState(false);
  const [blockForm, setBlockForm] = useState({ name: "", description: "", weeks: "4" });

  async function handleSavePlan() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          raceDate: form.raceDate || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update plan");
        setSaving(false);
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Failed to update plan");
    }
    setSaving(false);
  }

  async function handleStatusChange(newStatus: string) {
    try {
      const res = await fetch(`/api/plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setForm({ ...form, status: newStatus });
        router.refresh();
      }
    } catch {
      setError("Failed to update status");
    }
  }

  async function handleDeletePlan() {
    if (
      !confirm("Delete this plan and all its blocks, weeks, and workouts?")
    )
      return;
    try {
      await fetch(`/api/plans/${plan.id}`, { method: "DELETE" });
      router.push(`/coach/runners/${plan.runnerId}`);
    } catch {
      setError("Failed to delete plan");
    }
  }

  async function handleAddBlock() {
    if (!blockForm.name) {
      setError("Block name is required");
      return;
    }
    if (!blockForm.weeks || parseInt(blockForm.weeks) < 1) {
      setError("Number of weeks must be at least 1");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/plans/${plan.id}/blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: blockForm.name,
          description: blockForm.description,
          weeks: parseInt(blockForm.weeks),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add block");
        setSaving(false);
        return;
      }
      setAddingBlock(false);
      setBlockForm({ name: "", description: "", weeks: "4" });
      router.refresh();
    } catch {
      setError("Failed to add block");
    }
    setSaving(false);
  }

  async function handleReorder(blockId: string, direction: "up" | "down") {
    const blocks = plan.blocks;
    const idx = blocks.findIndex((b) => b.id === blockId);
    if (
      (direction === "up" && idx === 0) ||
      (direction === "down" && idx === blocks.length - 1)
    )
      return;

    const newOrder = blocks.map((b) => b.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];

    try {
      await fetch(`/api/plans/${plan.id}/blocks/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockIds: newOrder }),
      });
      router.refresh();
    } catch {
      setError("Failed to reorder blocks");
    }
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  const statusCfg = planStatusConfig[plan.status] || planStatusConfig.DRAFT;

  // Calculate total assigned weeks and weeks to race
  const totalWeeks = plan.blocks.reduce((sum, b) => sum + b.weeks.length, 0);
  const weeksToRace =
    plan.raceDate && plan.startDate
      ? Math.ceil(
          (new Date(plan.raceDate).getTime() -
            new Date(plan.startDate).getTime()) /
            (7 * 24 * 60 * 60 * 1000)
        )
      : null;

  return (
    <div>
      {/* Back link */}
      <div className="mb-4">
        <Link
          href={`/coach/runners/${plan.runnerId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to {plan.runner.name}
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-md p-3 mb-4">
          {error}
        </div>
      )}

      {/* Plan header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Goal
                </label>
                <input
                  type="text"
                  value={form.goal}
                  onChange={(e) => setForm({ ...form, goal: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Start Date
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
                  End Date
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Race Date
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
            <div className="flex justify-end gap-2">
              <button
                onClick={handleSavePlan}
                disabled={saving}
                className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setForm({
                    name: plan.name,
                    goal: plan.goal,
                    raceDate: plan.raceDate
                      ? plan.raceDate.split("T")[0]
                      : "",
                    startDate: plan.startDate.split("T")[0],
                    endDate: plan.endDate.split("T")[0],
                    status: plan.status,
                  });
                }}
                className="border border-gray-300 text-gray-700 rounded-md px-4 py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{plan.name}</h1>
                  <select
                    value={plan.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium border-0 cursor-pointer ${statusCfg.bgClass}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {planStatusConfig[s].label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-sm text-gray-600 mt-1">{plan.goal}</p>
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  <span>
                    Start: {new Date(plan.startDate).toLocaleDateString()}
                  </span>
                  {plan.raceDate && (
                    <span>
                      Race: {new Date(plan.raceDate).toLocaleDateString()}
                    </span>
                  )}
                  {weeksToRace !== null && (
                    <span className="text-blue-600 font-medium">
                      {totalWeeks}/{weeksToRace} weeks planned
                    </span>
                  )}
                  {weeksToRace === null && totalWeeks > 0 && (
                    <span>{totalWeeks} weeks planned</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeletePlan}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Blocks section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          Blocks ({plan.blocks.length})
        </h2>
        {!addingBlock && (
          <button
            onClick={() => setAddingBlock(true)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Add Block
          </button>
        )}
      </div>

      {addingBlock && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Block Name *
              </label>
              <input
                type="text"
                value={blockForm.name}
                onChange={(e) =>
                  setBlockForm({ ...blockForm, name: e.target.value })
                }
                className={inputClass}
                placeholder="e.g. Base Building"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Number of Weeks *
              </label>
              <input
                type="number"
                value={blockForm.weeks}
                onChange={(e) =>
                  setBlockForm({ ...blockForm, weeks: e.target.value })
                }
                className={inputClass}
                min="1"
                max="52"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Description
              </label>
              <input
                type="text"
                value={blockForm.description}
                onChange={(e) =>
                  setBlockForm({ ...blockForm, description: e.target.value })
                }
                className={inputClass}
                placeholder="e.g. Build aerobic base"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={handleAddBlock}
              disabled={saving}
              className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "..." : "Add Block"}
            </button>
            <button
              onClick={() => {
                setAddingBlock(false);
                setBlockForm({ name: "", description: "", weeks: "4" });
              }}
              className="border border-gray-300 text-gray-700 rounded-md px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {plan.blocks.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-sm text-gray-500">
          No blocks yet. Add a block to start building this plan.
        </div>
      ) : (
        <div className="space-y-3">
          {plan.blocks.map((block, idx) => (
            <BlockCard
              key={block.id}
              block={block}
              planId={plan.id}
              isFirst={idx === 0}
              isLast={idx === plan.blocks.length - 1}
              onReorder={handleReorder}
              catalogueSessions={catalogueSessions}
              logsByWorkoutId={logsByWorkoutId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export type { CatalogueSession, Workout, Week, Block, Plan };
