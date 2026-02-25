"use client";

import { useState } from "react";
import Link from "next/link";
import OverviewTab from "./overview-tab";
import ProfileTab from "./profile-tab";
import PbsTab from "./pbs-tab";
import GoalsTab from "./goals-tab";
import HealthTab from "./health-tab";
import NutritionTab from "./nutrition-tab";
import PlansTab from "./plans-tab";
import { planStatusConfig } from "@/lib/workout-utils";
import WeekRow from "@/app/coach/plans/[planId]/_components/week-row";
import type {
  Week,
  CatalogueSession,
  WorkoutLogSummary,
} from "@/app/coach/plans/[planId]/_components/plan-detail";

type RunnerData = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  profile: Record<string, unknown> | null;
  nutritionPlan: Record<string, unknown> | null;
  personalBests: Record<string, unknown>[];
  goals: Record<string, unknown>[];
  healthLogsAsRunner: (Record<string, unknown> & {
    author: { name: string };
  })[];
  reviews: Record<string, unknown>[];
  plans: (Record<string, unknown> & {
    _count: { blocks: number };
  })[];
};

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "profile", label: "Profile" },
  { key: "pbs", label: "PBs" },
  { key: "goals", label: "Goals" },
  { key: "health", label: "Health" },
  { key: "nutrition", label: "Nutrition" },
  { key: "plans", label: "All Plans" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function RunnerDetail({
  runner,
  upcomingWeeks,
  logsByWorkoutId,
  catalogueSessions,
  activePlanId,
}: {
  runner: RunnerData;
  upcomingWeeks?: Week[];
  logsByWorkoutId?: Record<string, WorkoutLogSummary>;
  catalogueSessions?: CatalogueSession[];
  activePlanId?: string;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // Find the active plan (status === "ACTIVE")
  const activePlan = runner.plans.find((p) => p.status === "ACTIVE") as
    | (Record<string, unknown> & { _count: { blocks: number } })
    | undefined;

  const hasUpcomingWeeks =
    upcomingWeeks && upcomingWeeks.length > 0 && catalogueSessions && logsByWorkoutId;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/coach"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to Dashboard
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold">{runner.name}</h1>
          {!runner.isActive && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              Inactive
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">{runner.email}</p>
      </div>

      {/* Active Training Plan — shown directly, not in a tab */}
      {activePlan ? (
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-lg">
                  {activePlan.name as string}
                </h2>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${planStatusConfig.ACTIVE.bgClass}`}
                >
                  {planStatusConfig.ACTIVE.label}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {activePlan.goal as string}
              </p>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span>
                  Start:{" "}
                  {new Date(
                    activePlan.startDate as string
                  ).toLocaleDateString()}
                </span>
                {activePlan.raceDate ? (
                  <span>
                    Race:{" "}
                    {new Date(
                      activePlan.raceDate as string
                    ).toLocaleDateString()}
                  </span>
                ) : null}
                <span>
                  {activePlan._count.blocks} block
                  {activePlan._count.blocks !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <Link
              href={`/coach/plans/${activePlan.id as string}`}
              className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm hover:bg-blue-700"
            >
              View Plan
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-6 text-center">
          <p className="text-sm text-gray-500 mb-2">
            No active training plan
          </p>
          <button
            onClick={() => setActiveTab("plans")}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Create or activate a plan
          </button>
        </div>
      )}

      {/* Next 4 Weeks — rendered when active plan has upcoming weeks */}
      {hasUpcomingWeeks && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Next 4 Weeks</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
            {upcomingWeeks.map((week) => (
              <WeekRow
                key={week.id}
                week={week}
                catalogueSessions={catalogueSessions}
                logsByWorkoutId={logsByWorkoutId}
              />
            ))}
          </div>
          {activePlanId && (
            <div className="mt-3">
              <Link
                href={`/coach/plans/${activePlanId}`}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Full Plan &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "overview" && <OverviewTab runner={runner} />}
      {activeTab === "profile" && (
        <ProfileTab runnerId={runner.id} profile={runner.profile} />
      )}
      {activeTab === "pbs" && (
        <PbsTab runnerId={runner.id} personalBests={runner.personalBests} />
      )}
      {activeTab === "goals" && (
        <GoalsTab runnerId={runner.id} goals={runner.goals} />
      )}
      {activeTab === "health" && (
        <HealthTab
          runnerId={runner.id}
          healthLogs={runner.healthLogsAsRunner}
        />
      )}
      {activeTab === "nutrition" && (
        <NutritionTab
          runnerId={runner.id}
          nutritionPlan={runner.nutritionPlan}
        />
      )}
      {activeTab === "plans" && (
        <PlansTab
          runnerId={runner.id}
          plans={runner.plans}
        />
      )}
    </div>
  );
}
