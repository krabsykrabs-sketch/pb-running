"use client";

import { useState, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { RunnerDashboardData, ReviewStatus } from "../page";

type SortField = "urgency" | "compliance" | "injuries" | "name" | "lastReviewed";

const reviewStatusConfig: Record<
  ReviewStatus,
  { label: string; className: string }
> = {
  overdue: { label: "Overdue", className: "bg-red-100 text-red-800" },
  due_soon: { label: "Due Soon", className: "bg-yellow-100 text-yellow-800" },
  current: { label: "Current", className: "bg-green-100 text-green-800" },
  never_reviewed: {
    label: "Never Reviewed",
    className: "bg-gray-100 text-gray-600",
  },
};

function complianceColor(percent: number | null): string {
  if (percent === null) return "text-gray-400";
  if (percent < 50) return "text-red-600 font-medium";
  if (percent <= 80) return "text-yellow-600 font-medium";
  return "text-green-600 font-medium";
}

export default function CoachDashboard({
  runners,
}: {
  runners: RunnerDashboardData[];
}) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>("urgency");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sorted = useMemo(() => {
    const arr = [...runners];
    switch (sortField) {
      case "urgency":
        arr.sort((a, b) => b.reviewUrgencyScore - a.reviewUrgencyScore);
        break;
      case "compliance":
        arr.sort((a, b) => {
          const aVal = a.compliancePercent ?? 101;
          const bVal = b.compliancePercent ?? 101;
          return aVal - bVal;
        });
        break;
      case "injuries":
        arr.sort((a, b) => {
          if (a.hasSevereInjury !== b.hasSevereInjury)
            return a.hasSevereInjury ? -1 : 1;
          return b.injuryCount - a.injuryCount;
        });
        break;
      case "name":
        arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "lastReviewed":
        arr.sort((a, b) => {
          const aVal = a.daysSinceLastReview ?? 9999;
          const bVal = b.daysSinceLastReview ?? 9999;
          return bVal - aVal;
        });
        break;
    }
    return arr;
  }, [runners, sortField]);

  async function handleMarkReviewed(runnerId: string) {
    if (!reviewNotes.trim()) {
      setError("Review notes are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/runners/${runnerId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: reviewNotes }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save review");
        setSaving(false);
        return;
      }
      setReviewingId(null);
      setReviewNotes("");
      router.refresh();
    } catch {
      setError("Failed to save review");
    }
    setSaving(false);
  }

  const thClass =
    "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
  const thSortable = `${thClass} cursor-pointer hover:text-gray-700 select-none`;
  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  function SortIndicator({ field }: { field: SortField }) {
    return sortField === field ? (
      <span className="ml-1 text-blue-600">&#9660;</span>
    ) : null;
  }

  if (runners.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-12 text-center text-sm text-gray-500">
          No runners yet.{" "}
          <Link
            href="/coach/runners/new"
            className="text-blue-600 hover:text-blue-700"
          >
            Add your first runner
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 border-b border-red-100">
          {error}
        </div>
      )}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              className={thSortable}
              onClick={() => setSortField("name")}
            >
              Name
              <SortIndicator field="name" />
            </th>
            <th
              className={thSortable}
              onClick={() => setSortField("compliance")}
            >
              Compliance
              <SortIndicator field="compliance" />
            </th>
            <th
              className={thSortable}
              onClick={() => setSortField("urgency")}
            >
              Review Status
              <SortIndicator field="urgency" />
            </th>
            <th
              className={thSortable}
              onClick={() => setSortField("injuries")}
            >
              Injuries
              <SortIndicator field="injuries" />
            </th>
            <th className={thClass}>Conflicts</th>
            <th
              className={thSortable}
              onClick={() => setSortField("lastReviewed")}
            >
              Last Reviewed
              <SortIndicator field="lastReviewed" />
            </th>
            <th className={thClass}>Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sorted.map((runner) => (
            <Fragment key={runner.id}>
              <tr className="hover:bg-gray-50">
                {/* Name */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link
                    href={`/coach/runners/${runner.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    {runner.name}
                  </Link>
                </td>

                {/* Compliance */}
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span className={complianceColor(runner.compliancePercent)}>
                    {runner.compliancePercent !== null
                      ? `${runner.compliancePercent}%`
                      : "—"}
                  </span>
                  {runner.compliancePercent !== null && (
                    <span className="text-xs text-gray-400 ml-1">
                      ({runner.completedWorkouts}/{runner.totalWorkouts})
                    </span>
                  )}
                </td>

                {/* Review Status */}
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${reviewStatusConfig[runner.reviewStatus].className}`}
                  >
                    {reviewStatusConfig[runner.reviewStatus].label}
                  </span>
                </td>

                {/* Injuries */}
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  {runner.injuryCount > 0 ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        runner.hasSevereInjury
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {runner.injuryCount}
                    </span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </td>

                {/* Conflicts */}
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span
                    className={
                      runner.conflictCount > 0
                        ? "text-orange-600 font-medium"
                        : "text-gray-400"
                    }
                  >
                    {runner.conflictCount}
                  </span>
                </td>

                {/* Last Reviewed */}
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {runner.lastReviewedAt
                    ? new Date(runner.lastReviewedAt).toLocaleDateString()
                    : "Never"}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  {reviewingId === runner.id ? (
                    <button
                      onClick={() => {
                        setReviewingId(null);
                        setReviewNotes("");
                        setError("");
                      }}
                      className="text-gray-500 hover:text-gray-700 text-xs"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setReviewingId(runner.id);
                        setReviewNotes("");
                        setError("");
                      }}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                    >
                      Mark Reviewed
                    </button>
                  )}
                </td>
              </tr>

              {/* Inline review form */}
              {reviewingId === runner.id && (
                <tr className="bg-gray-50">
                  <td colSpan={7} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Review notes..."
                        className={`${inputClass} flex-1`}
                        rows={2}
                      />
                      <button
                        onClick={() => handleMarkReviewed(runner.id)}
                        disabled={saving}
                        className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                      >
                        {saving ? "..." : "Save Review"}
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
