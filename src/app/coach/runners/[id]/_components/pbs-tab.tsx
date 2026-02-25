"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PB = Record<string, unknown>;

export default function PbsTab({
  runnerId,
  personalBests,
}: {
  runnerId: string;
  personalBests: PB[];
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    distance: "",
    time: "",
    raceName: "",
    date: new Date().toISOString().split("T")[0],
  });

  function resetForm() {
    setForm({
      distance: "",
      time: "",
      raceName: "",
      date: new Date().toISOString().split("T")[0],
    });
  }

  function startEdit(pb: PB) {
    setEditingId(pb.id as string);
    setForm({
      distance: pb.distance as string,
      time: pb.time as string,
      raceName: (pb.raceName as string) || "",
      date: (pb.date as string).split("T")[0],
    });
    setShowAdd(false);
  }

  async function handleAdd() {
    if (!form.distance || !form.time || !form.date) {
      setError("Distance, time, and date are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/runners/${runnerId}/pbs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add PB");
        setSaving(false);
        return;
      }
      setShowAdd(false);
      resetForm();
      router.refresh();
    } catch {
      setError("Failed to add PB");
    }
    setSaving(false);
  }

  async function handleUpdate() {
    if (!editingId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/runners/${runnerId}/pbs/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update PB");
        setSaving(false);
        return;
      }
      setEditingId(null);
      resetForm();
      router.refresh();
    } catch {
      setError("Failed to update PB");
    }
    setSaving(false);
  }

  async function handleDelete(pbId: string) {
    if (!confirm("Delete this PB?")) return;
    try {
      await fetch(`/api/runners/${runnerId}/pbs/${pbId}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch {
      setError("Failed to delete PB");
    }
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  function PBForm({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) {
    return (
      <div className="grid grid-cols-5 gap-2 items-end bg-gray-50 rounded-lg p-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Distance *</label>
          <input
            type="text"
            value={form.distance}
            onChange={(e) => setForm({ ...form, distance: e.target.value })}
            className={inputClass}
            placeholder="e.g. 5K"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Time *</label>
          <input
            type="text"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            className={inputClass}
            placeholder="e.g. 22:30"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Race Name</label>
          <input
            type="text"
            value={form.raceName}
            onChange={(e) => setForm({ ...form, raceName: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Date *</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="flex gap-1">
          <button
            onClick={onSubmit}
            disabled={saving}
            className="bg-blue-600 text-white rounded-md px-3 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "..." : submitLabel}
          </button>
          <button
            onClick={() => {
              setShowAdd(false);
              setEditingId(null);
              resetForm();
            }}
            className="border border-gray-300 text-gray-700 rounded-md px-3 py-2 text-sm hover:bg-gray-50"
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
        <h2 className="text-lg font-semibold">Personal Bests</h2>
        {!showAdd && !editingId && (
          <button
            onClick={() => {
              resetForm();
              setShowAdd(true);
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Add PB
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-md p-3 mb-4">
          {error}
        </div>
      )}

      {showAdd && <div className="mb-4"><PBForm onSubmit={handleAdd} submitLabel="Add" /></div>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {personalBests.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  No personal bests recorded
                </td>
              </tr>
            ) : (
              personalBests.map((pb) => (
                <tr key={pb.id as string}>
                  {editingId === pb.id ? (
                    <td colSpan={5} className="p-2">
                      <PBForm onSubmit={handleUpdate} submitLabel="Save" />
                    </td>
                  ) : (
                    <>
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
                      <td className="px-4 py-3 text-right text-sm">
                        <button
                          onClick={() => startEdit(pb)}
                          className="text-blue-600 hover:text-blue-700 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(pb.id as string)}
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
