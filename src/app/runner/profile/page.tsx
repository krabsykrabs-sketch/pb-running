import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import RunnerProfileView from "./_components/runner-profile-view";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id as string;

  const runner = await prisma.user.findUnique({
    where: { id: userId, role: "RUNNER" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      profile: true,
      nutritionPlan: true,
      personalBests: { orderBy: { date: "desc" } },
      goals: { orderBy: { targetDate: "asc" } },
      healthLogsAsRunner: {
        include: { author: { select: { name: true } } },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!runner) redirect("/login");

  const serialized = JSON.parse(JSON.stringify(runner));

  return <RunnerProfileView runner={serialized} />;
}
