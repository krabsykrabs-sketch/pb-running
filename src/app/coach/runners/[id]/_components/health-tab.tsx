"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type HealthLog = Record<string, unknown> & { author: { name: string } };

const severityColors: Record<string, string> = {
  MINOR: "bg-green-100 text-green-800",
  MODERATE: "bg-yellow-100 text-yellow-800",
  SEVERE: "bg-red-100 text-red-800",
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-gray-100 text-gray-600",
};

export default function HealthTab({
  runnerId,
  healthLogs,
}: {
  runnerId: string;
  healthLogs: HealthLog[];
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
    <div>
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
          <p className="text-sm text-gray-500 text-center py-8">
            No health entries
          </p>
        ) : (
          healthLogs.map((log) => (
            <div
              key={log.id as string}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${severityColors[log.severity as string] || ""}`}
                  >
                    {log.severity as string}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[log.status as string] || ""}`}
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
    </div>
  );
}
