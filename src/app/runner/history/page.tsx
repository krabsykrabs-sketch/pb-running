import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import WorkoutHistory from "../_components/workout-history";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id as string;

  const logs = await prisma.workoutLog.findMany({
    where: { runnerId: userId },
    orderBy: { loggedAt: "desc" },
    include: {
      workout: {
        select: {
          id: true,
          date: true,
          title: true,
          workoutType: true,
          activity: true,
          distanceKm: true,
          targetPace: true,
          durationMin: true,
          intensity: true,
        },
      },
      _count: { select: { comments: true } },
    },
  });

  // Check for unread comments
  const logIds = logs.map((l) => l.id);
  const unreadComments =
    logIds.length > 0
      ? await prisma.comment.groupBy({
          by: ["workoutLogId"],
          where: {
            workoutLogId: { in: logIds },
            read: false,
            authorId: { not: userId },
          },
          _count: true,
        })
      : [];
  const unreadByLogId = new Set(unreadComments.map((u) => u.workoutLogId));

  const serializedLogs = logs.map((log) => ({
    id: log.id,
    workoutId: log.workoutId,
    completed: log.completed,
    actualDistanceKm: log.actualDistanceKm ? String(log.actualDistanceKm) : null,
    actualPace: log.actualPace,
    actualDurationMin: log.actualDurationMin,
    avgHeartRate: log.avgHeartRate,
    rpe: log.rpe,
    runnerNotes: log.runnerNotes,
    loggedAt: log.loggedAt.toISOString(),
    commentCount: log._count.comments,
    hasUnreadComments: unreadByLogId.has(log.id),
    workout: {
      id: log.workout.id,
      date: log.workout.date.toISOString(),
      title: log.workout.title,
      workoutType: log.workout.workoutType,
      activity: log.workout.activity,
      distanceKm: log.workout.distanceKm ? String(log.workout.distanceKm) : null,
      targetPace: log.workout.targetPace,
      durationMin: log.workout.durationMin,
      intensity: log.workout.intensity,
    },
  }));

  return <WorkoutHistory logs={serializedLogs} />;
}
