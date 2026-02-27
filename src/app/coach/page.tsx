import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CoachDashboard from "./_components/coach-dashboard";

export type ReviewStatus = "overdue" | "due_soon" | "current" | "never_reviewed";

export type RunnerDashboardData = {
  id: string;
  name: string;
  email: string;
  compliancePercent: number | null;
  totalWorkouts: number;
  completedWorkouts: number;
  reviewStatus: ReviewStatus;
  daysSinceLastReview: number | null;
  reviewIntervalDays: number;
  lastReviewedAt: string | null;
  injuryCount: number;
  hasSevereInjury: boolean;
  hasModerateInjury: boolean;
  conflictCount: number;
  reviewUrgencyScore: number;
};

export default async function CoachDashboardPage() {
  const runners = await prisma.user.findMany({
    where: { role: "RUNNER" },
    include: {
      profile: {
        select: { reviewIntervalDays: true },
      },
      healthLogsAsRunner: {
        where: { status: "ACTIVE", severity: { in: ["MODERATE", "SEVERE"] } },
        select: { severity: true },
      },
      reviews: { orderBy: { reviewedAt: "desc" }, take: 1 },
      plans: {
        where: { status: "ACTIVE" },
        take: 1,
        include: {
          blocks: {
            include: {
              weeks: {
                include: {
                  workouts: {
                    select: { id: true, date: true },
                  },
                },
              },
            },
          },
        },
      },
      workoutLogs: {
        where: { completed: true },
        select: { workoutId: true },
      },
      availability: {
        select: { date: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const dashboardData: RunnerDashboardData[] = runners.map((runner) => {
    // ── Compliance ──
    const activePlan = runner.plans[0];
    let compliancePercent: number | null = null;
    let totalWorkouts = 0;
    let completedWorkouts = 0;

    const allWorkouts: { id: string; date: Date }[] = [];

    if (activePlan) {
      for (const block of activePlan.blocks) {
        for (const week of block.weeks) {
          for (const workout of week.workouts) {
            allWorkouts.push({ id: workout.id, date: new Date(workout.date) });
          }
        }
      }

      const completedLogIds = new Set(runner.workoutLogs.map((l) => l.workoutId));

      const pastWorkouts = allWorkouts.filter((w) => {
        const d = new Date(w.date);
        d.setUTCHours(0, 0, 0, 0);
        return d <= today;
      });

      totalWorkouts = pastWorkouts.length;
      completedWorkouts = pastWorkouts.filter((w) => completedLogIds.has(w.id)).length;

      compliancePercent =
        totalWorkouts > 0
          ? Math.round((completedWorkouts / totalWorkouts) * 100)
          : null;
    }

    // ── Review status ──
    const reviewIntervalDays = runner.profile?.reviewIntervalDays ?? 7;
    const lastReview = runner.reviews[0];
    let reviewStatus: ReviewStatus;
    let daysSinceLastReview: number | null = null;
    let reviewUrgencyScore: number;

    if (!lastReview) {
      reviewStatus = "never_reviewed";
      const daysSinceCreation = Math.floor(
        (today.getTime() - new Date(runner.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      reviewUrgencyScore = 1000 + Math.min(daysSinceCreation, 365);
    } else {
      const lastReviewDate = new Date(lastReview.reviewedAt);
      lastReviewDate.setUTCHours(0, 0, 0, 0);
      daysSinceLastReview = Math.floor(
        (today.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastReview >= reviewIntervalDays) {
        reviewStatus = "overdue";
        reviewUrgencyScore = 500 + (daysSinceLastReview - reviewIntervalDays);
      } else if (daysSinceLastReview >= reviewIntervalDays - 2) {
        reviewStatus = "due_soon";
        reviewUrgencyScore = 100 + daysSinceLastReview;
      } else {
        reviewStatus = "current";
        reviewUrgencyScore = daysSinceLastReview;
      }
    }

    // ── Injuries ──
    const injuryCount = runner.healthLogsAsRunner.length;
    const hasSevereInjury = runner.healthLogsAsRunner.some(
      (h) => h.severity === "SEVERE"
    );
    const hasModerateInjury = runner.healthLogsAsRunner.some(
      (h) => h.severity === "MODERATE"
    );

    // ── Conflicts ──
    const availabilityDates = new Set(
      runner.availability.map(
        (a) => new Date(a.date).toISOString().split("T")[0]
      )
    );

    let conflictCount = 0;
    if (activePlan) {
      for (const w of allWorkouts) {
        const dateStr = new Date(w.date).toISOString().split("T")[0];
        if (availabilityDates.has(dateStr)) {
          conflictCount++;
        }
      }
    }

    return {
      id: runner.id,
      name: runner.name,
      email: runner.email,
      compliancePercent,
      totalWorkouts,
      completedWorkouts,
      reviewStatus,
      daysSinceLastReview,
      reviewIntervalDays,
      lastReviewedAt: lastReview
        ? lastReview.reviewedAt.toISOString()
        : null,
      injuryCount,
      hasSevereInjury,
      hasModerateInjury,
      conflictCount,
      reviewUrgencyScore,
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Coach Dashboard</h1>
        <Link
          href="/coach/runners/new"
          className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          Add Runner
        </Link>
      </div>
      <CoachDashboard runners={dashboardData} />
    </div>
  );
}
