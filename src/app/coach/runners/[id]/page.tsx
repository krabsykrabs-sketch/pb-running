import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RunnerDetail from "./_components/runner-detail";
import type {
  Week,
  CatalogueSession,
  WorkoutLogSummary,
} from "@/app/coach/plans/[planId]/_components/plan-detail";

export default async function RunnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const runner = await prisma.user.findUnique({
    where: { id, role: "RUNNER" },
    include: {
      profile: true,
      nutritionPlan: true,
      personalBests: { orderBy: { date: "desc" } },
      goals: { orderBy: { targetDate: "asc" } },
      healthLogsAsRunner: {
        include: { author: { select: { name: true } } },
        orderBy: { date: "desc" },
      },
      reviews: { orderBy: { reviewedAt: "desc" }, take: 5 },
      plans: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { blocks: true } } },
      },
    },
  });

  if (!runner) notFound();

  // Check for active plan and fetch upcoming weeks data
  const activePlan = runner.plans.find((p) => p.status === "ACTIVE");

  let upcomingWeeks: Week[] | undefined;
  let logsByWorkoutId: Record<string, WorkoutLogSummary> | undefined;
  let catalogueSessions: CatalogueSession[] | undefined;
  let activePlanId: string | undefined;

  if (activePlan) {
    activePlanId = activePlan.id;

    // Fetch full plan with nested blocks/weeks/workouts
    const fullPlan = await prisma.plan.findUnique({
      where: { id: activePlan.id },
      include: {
        blocks: {
          orderBy: { orderIndex: "asc" },
          include: {
            weeks: {
              orderBy: { weekNumber: "asc" },
              include: {
                workouts: {
                  orderBy: { date: "asc" },
                  include: { catalogueSession: true },
                },
              },
            },
          },
        },
      },
    });

    if (fullPlan) {
      // Flatten all weeks across blocks in order
      const allWeeks = fullPlan.blocks.flatMap((b) => b.weeks);

      // Find current week: the latest week whose startDate <= today
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      let currentWeekIdx = -1;
      for (let i = 0; i < allWeeks.length; i++) {
        const weekStart = new Date(allWeeks[i].startDate);
        weekStart.setUTCHours(0, 0, 0, 0);
        if (weekStart <= today) {
          currentWeekIdx = i;
        } else {
          break;
        }
      }

      // If today is before the first week, start from 0
      if (currentWeekIdx === -1) currentWeekIdx = 0;

      // Take current week + up to 3 following weeks
      const selectedWeeks = allWeeks.slice(currentWeekIdx, currentWeekIdx + 4);

      if (selectedWeeks.length > 0) {
        // Fetch workout logs for these weeks
        const workoutIds = selectedWeeks.flatMap((w) =>
          w.workouts.map((wo) => wo.id)
        );

        const workoutLogs =
          workoutIds.length > 0
            ? await prisma.workoutLog.findMany({
                where: { workoutId: { in: workoutIds } },
                include: { _count: { select: { comments: true } } },
              })
            : [];

        const logsMap: Record<string, WorkoutLogSummary> = {};

        for (const log of workoutLogs) {
          logsMap[log.workoutId] = {
            id: log.id,
            workoutId: log.workoutId,
            completed: log.completed,
            actualDistanceKm: log.actualDistanceKm
              ? String(log.actualDistanceKm)
              : null,
            actualPace: log.actualPace,
            actualDurationMin: log.actualDurationMin,
            avgHeartRate: log.avgHeartRate,
            rpe: log.rpe,
            runnerNotes: log.runnerNotes,
            commentCount: log._count.comments,
          };
        }

        logsByWorkoutId = logsMap;
        upcomingWeeks = JSON.parse(JSON.stringify(selectedWeeks));

        // Fetch catalogue sessions
        const sessions = await prisma.sessionCatalogue.findMany({
          orderBy: { name: "asc" },
        });
        catalogueSessions = JSON.parse(JSON.stringify(sessions));
      }
    }
  }

  // Serialize Prisma Date/Decimal objects to JSON-safe values for client component
  const serialized = JSON.parse(JSON.stringify(runner));

  return (
    <RunnerDetail
      runner={serialized}
      upcomingWeeks={upcomingWeeks}
      logsByWorkoutId={logsByWorkoutId}
      catalogueSessions={catalogueSessions}
      activePlanId={activePlanId}
    />
  );
}
