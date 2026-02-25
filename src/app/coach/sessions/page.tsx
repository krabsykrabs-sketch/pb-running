import { prisma } from "@/lib/prisma";
import SessionsList from "./_components/sessions-list";

export default async function SessionsPage() {
  const sessions = await prisma.sessionCatalogue.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { workouts: true } } },
  });

  const serialized = JSON.parse(JSON.stringify(sessions));

  return <SessionsList sessions={serialized} />;
}
