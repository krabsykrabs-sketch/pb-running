"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Goal = Record<string, unknown>;

const statusColors: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-800",
  ACHIEVED: "bg-green-100 text-green-800",
  ABANDONED: "bg-gray-100 text-gray-600",
};

export default function GoalsTab({
  runnerId,
  goals,
}: {
  runnerId: string;
  goals: Goal[];
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    description: "",
    targetDate: "",
    status: "ACTIVE",
  });

  function resetForm() {
    setForm({ description: "", targetDate: "", status: "ACTIVE" });
  }

  function startEdit(goal: Goal) {
    setEditingId(goal.id as string);
    setForm({
      description: goal.description as string,
      targetDate: (goal.targetDate as string).split("T")[0],
      status: goal.status as string,
    });
    setShowAdd(false);
  }

  async function handleAdd() {
    if (!form.description || !form.targetDate) {
      setError("Description and target date are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/runners/${runnerId}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add goal");
        setSaving(false);
        return;
      }
      setShowAdd(false);
      resetForm();
      router.refresh();
    } catch {
      setError("Failed to add goal");
    }
    setSaving(false);
  }

  async function handleUpdate() {
    if (!editingId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/runners/${runnerId}/goals/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update goal");
        setSaving(false);
        return;
      }
      setEditingId(null);
      resetForm();
      router.refresh();
    } catch {
      setError("Failed to update goal");
    }
    setSaving(false);
  }

  async function handleDelete(goalId: string) {
    if (!confirm("Delete this goal?")) return;
    try {
      await fetch(`/api/runners/${runnerId}/goals/${goalId}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch {
      setError("Failed to delete goal");
    }
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  function GoalForm({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Description *
          </label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={inputClass}
            placeholder="e.g. Complete a half marathon"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Target Date *
            </label>
            <input
              type="date"
              value={form.targetDate}
              onChange={(e) =>
                setForm({ ...form, targetDate: e.target.value })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className={inputClass}
            >
              <option value="ACTIVE">Active</option>
              <option value="ACHIEVED">Achieved</option>
              <option value="ABANDONED">Abandoned</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSubmit}
            disabled={saving}
            className="bg-blue-600 text-white rounded-md px-4 py-1.5 text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "..." : submitLabel}
          </button>
          <button
            onClick={() => {
              setShowAdd(false);
              setEditingId(null);
              resetForm();
            }}
            className="border border-gray-300 text-gray-700 rounded-md px-4 py-1.5 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Goals</h2>
        {!showAdd && !editingId && (
          <button
            onClick={() => {
              resetForm();
              setShowAdd(true);
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Add Goal
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-md p-3 mb-4">
          {error}
        </div>
      )}

      {showAdd && <div className="mb-4"><GoalForm onSubmit={handleAdd} submitLabel="Add" /></div>}

      <div className="space-y-3">
        {goals.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No goals set
          </p>
        ) : (
          goals.map((goal) =>
            editingId === goal.id ? (
              <GoalForm
                key={goal.id as string}
                onSubmit={handleUpdate}
                submitLabel="Save"
              />
            ) : (
              <div
                key={goal.id as string}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[goal.status as string] || ""}`}
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
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(goal)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id as string)}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}
