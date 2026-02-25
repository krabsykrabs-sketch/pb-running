"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WeekRow from "./week-row";
import type { Block, CatalogueSession, WorkoutLogSummary } from "./plan-detail";

export default function BlockCard({
  block,
  planId,
  isFirst,
  isLast,
  onReorder,
  catalogueSessions,
  logsByWorkoutId,
}: {
  block: Block;
  planId: string;
  isFirst: boolean;
  isLast: boolean;
  onReorder: (blockId: string, direction: "up" | "down") => void;
  catalogueSessions: CatalogueSession[];
  logsByWorkoutId: Record<string, WorkoutLogSummary>;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: block.name,
    description: block.description,
  });

  const totalWeeks = block.weeks.length;
  const totalKm = block.weeks.reduce(
    (sum, w) => sum + (w.targetKm ? parseFloat(w.targetKm) : 0),
    0
  );

  async function handleSaveBlock() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/plans/${planId}/blocks/${block.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update block");
        setSaving(false);
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Failed to update block");
    }
    setSaving(false);
  }

  async function handleDeleteBlock() {
    if (!confirm("Delete this block and all its weeks and workouts?")) return;
    try {
      await fetch(`/api/plans/${planId}/blocks/${block.id}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch {
      setError("Failed to delete block");
    }
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Block header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">
            {expanded ? "▼" : "▶"}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{block.name}</h3>
              <span className="text-xs text-gray-500">
                {totalWeeks} week{totalWeeks !== 1 ? "s" : ""}
                {totalKm > 0 && ` · ${totalKm.toFixed(0)} km`}
              </span>
            </div>
            {block.description && (
              <p className="text-sm text-gray-500 mt-0.5">
                {block.description}
              </p>
            )}
          </div>
        </div>
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onReorder(block.id, "up")}
            disabled={isFirst}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            title="Move up"
          >
            ↑
          </button>
          <button
            onClick={() => onReorder(block.id, "down")}
            disabled={isLast}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            title="Move down"
          >
            ↓
          </button>
          <button
            onClick={() => {
              setEditing(true);
              setForm({ name: block.name, description: block.description });
            }}
            className="text-sm text-blue-600 hover:text-blue-700 ml-2"
          >
            Edit
          </button>
          <button
            onClick={handleDeleteBlock}
            className="text-sm text-red-500 hover:text-red-700 ml-2"
          >
            Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-2 bg-red-50 text-red-600 text-sm rounded-md p-3">
          {error}
        </div>
      )}

      {/* Edit block form */}
      {editing && (
        <div className="mx-4 mb-4 bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Block Name
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
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={handleSaveBlock}
              disabled={saving}
              className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "..." : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="border border-gray-300 text-gray-700 rounded-md px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Expanded content: weeks */}
      {expanded && (
        <div className="border-t border-gray-200">
          {block.weeks.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No weeks in this block
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {block.weeks.map((week) => (
                <WeekRow
                  key={week.id}
                  week={week}
                  catalogueSessions={catalogueSessions}
                  logsByWorkoutId={logsByWorkoutId}
                />
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
