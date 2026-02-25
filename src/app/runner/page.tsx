import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import RunnerDashboard from "./_components/runner-dashboard";

export default async function RunnerPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id as string;

  const plan = await prisma.plan.findFirst({
    where: { runnerId: userId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: {
      blocks: {
        orderBy: { orderIndex: "asc" },
        include: {
          weeks: {
            orderBy: { weekNumber: "asc" },
            include: {
              workouts: { orderBy: { date: "asc" } },
            },
          },
        },
      },
    },
  });

  // Strip coachNotes and coachWeekNote before sending to client
  const strippedPlan = plan
    ? {
        ...plan,
        blocks: plan.blocks.map((block) => ({
          ...block,
          weeks: block.weeks.map((week) => ({
            ...week,
            coachWeekNote: null,
            workouts: week.workouts.map((w) => ({
              ...w,
              coachNotes: null,
            })),
          })),
        })),
      }
    : null;

  const serializedPlan = strippedPlan
    ? JSON.parse(JSON.stringify(strippedPlan))
    : null;

  // Fetch availability entries
  const availabilityEntries = await prisma.runnerAvailability.findMany({
    where: { runnerId: userId },
  });

  const availabilityByDate: Record<string, { id: string; date: string; note: string }> = {};
  for (const entry of availabilityEntries) {
    const dateStr = new Date(entry.date).toISOString().split("T")[0];
    availabilityByDate[dateStr] = {
      id: entry.id,
      date: dateStr,
      note: entry.note,
    };
  }

  // Fetch workout logs for all workouts in the plan
  const workoutIds = plan
    ? plan.blocks.flatMap((b) => b.weeks.flatMap((w) => w.workouts.map((wo) => wo.id)))
    : [];

  const workoutLogs =
    workoutIds.length > 0
      ? await prisma.workoutLog.findMany({
          where: { workoutId: { in: workoutIds }, runnerId: userId },
        })
      : [];

  // Fetch unread comment counts grouped by logId
  const logIds = workoutLogs.map((l) => l.id);
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

  const logsByWorkoutId: Record<string, { id: string; workoutId: string; completed: boolean; runnerNotes: string | null; hasUnreadComments: boolean }> = {};
  for (const log of workoutLogs) {
    logsByWorkoutId[log.workoutId] = {
      id: log.id,
      workoutId: log.workoutId,
      completed: log.completed,
      runnerNotes: log.runnerNotes,
      hasUnreadComments: unreadByLogId.has(log.id),
    };
  }

  return (
    <RunnerDashboard
      plan={serializedPlan}
      availabilityByDate={availabilityByDate}
      logsByWorkoutId={logsByWorkoutId}
    />
  );
}
