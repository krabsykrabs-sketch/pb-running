import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import WorkoutDetail from "../../_components/workout-detail";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id as string;
  const { workoutId } = await params;

  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: {
      week: {
        include: {
          block: {
            include: {
              plan: { select: { runnerId: true } },
            },
          },
        },
      },
    },
  });

  if (!workout || workout.week.block.plan.runnerId !== userId) {
    notFound();
  }

  // Fetch log with comments
  const log = await prisma.workoutLog.findUnique({
    where: {
      workoutId_runnerId: {
        workoutId,
        runnerId: userId,
      },
    },
    include: {
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });

  // Strip coachNotes from workout
  const stripped = {
    ...workout,
    coachNotes: null,
    week: {
      id: workout.week.id,
      weekNumber: workout.week.weekNumber,
      startDate: workout.week.startDate,
    },
  };

  const serialized = JSON.parse(JSON.stringify(stripped));
  const serializedLog = log ? JSON.parse(JSON.stringify(log)) : null;

  return (
    <WorkoutDetail
      workout={serialized}
      log={serializedLog}
      userId={userId}
    />
  );
}
