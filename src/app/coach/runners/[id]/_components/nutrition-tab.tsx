"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type NutritionPlan = Record<string, unknown> | null;

export default function NutritionTab({
  runnerId,
  nutritionPlan,
}: {
  runnerId: string;
  nutritionPlan: NutritionPlan;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    generalStrategy: (nutritionPlan?.generalStrategy as string) || "",
    raceDay: (nutritionPlan?.raceDay as string) || "",
    supplements: (nutritionPlan?.supplements as string) || "",
  });

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/runners/${runnerId}/nutrition`, {
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
    "w-full rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-700 min-h-[60px] whitespace-pre-wrap";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Nutrition Plan</h2>
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
        <div>
          <label className={labelClass}>General Strategy</label>
          {editing ? (
            <textarea
              value={form.generalStrategy}
              onChange={(e) =>
                setForm({ ...form, generalStrategy: e.target.value })
              }
              className={inputClass}
              rows={3}
            />
          ) : (
            <div className={readonlyClass}>
              {form.generalStrategy || "—"}
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>Race Day Nutrition</label>
          {editing ? (
            <textarea
              value={form.raceDay}
              onChange={(e) =>
                setForm({ ...form, raceDay: e.target.value })
              }
              className={inputClass}
              rows={3}
            />
          ) : (
            <div className={readonlyClass}>{form.raceDay || "—"}</div>
          )}
        </div>

        <div>
          <label className={labelClass}>Supplements</label>
          {editing ? (
            <textarea
              value={form.supplements}
              onChange={(e) =>
                setForm({ ...form, supplements: e.target.value })
              }
              className={inputClass}
              rows={3}
            />
          ) : (
            <div className={readonlyClass}>
              {form.supplements || "—"}
            </div>
          )}
        </div>

        {nutritionPlan?.updatedAt ? (
          <p className="text-xs text-gray-400">
            Last updated:{" "}
            {new Date(
              nutritionPlan.updatedAt as string
            ).toLocaleDateString()}
          </p>
        ) : null}
      </div>
    </div>
  );
}
