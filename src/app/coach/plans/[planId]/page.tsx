import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PlanDetail from "./_components/plan-detail";

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: {
      runner: { select: { id: true, name: true } },
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

  if (!plan) notFound();

  const sessions = await prisma.sessionCatalogue.findMany({
    orderBy: { name: "asc" },
  });

  // Fetch all workout logs for workouts in this plan
  const workoutIds = plan.blocks.flatMap((b) =>
    b.weeks.flatMap((w) => w.workouts.map((wo) => wo.id))
  );

  const workoutLogs =
    workoutIds.length > 0
      ? await prisma.workoutLog.findMany({
          where: { workoutId: { in: workoutIds } },
          include: {
            _count: { select: { comments: true } },
          },
        })
      : [];

  const logsByWorkoutId: Record<
    string,
    {
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
    }
  > = {};

  for (const log of workoutLogs) {
    logsByWorkoutId[log.workoutId] = {
      id: log.id,
      workoutId: log.workoutId,
      completed: log.completed,
      actualDistanceKm: log.actualDistanceKm ? String(log.actualDistanceKm) : null,
      actualPace: log.actualPace,
      actualDurationMin: log.actualDurationMin,
      avgHeartRate: log.avgHeartRate,
      rpe: log.rpe,
      runnerNotes: log.runnerNotes,
      commentCount: log._count.comments,
    };
  }

  const serializedPlan = JSON.parse(JSON.stringify(plan));
  const serializedSessions = JSON.parse(JSON.stringify(sessions));

  return (
    <PlanDetail
      plan={serializedPlan}
      catalogueSessions={serializedSessions}
      logsByWorkoutId={logsByWorkoutId}
    />
  );
}
