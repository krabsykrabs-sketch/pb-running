import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CoachDashboard() {
  const runners = await prisma.user.findMany({
    where: { role: "RUNNER" },
    include: {
      goals: { where: { status: "ACTIVE" } },
      healthLogsAsRunner: {
        where: { status: "ACTIVE", severity: { in: ["MODERATE", "SEVERE"] } },
      },
      reviews: { orderBy: { reviewedAt: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Active Goals
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Active Injuries
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Review
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {runners.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-sm text-gray-500"
                >
                  No runners yet.{" "}
                  <Link
                    href="/coach/runners/new"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Add your first runner
                  </Link>
                </td>
              </tr>
            ) : (
              runners.map((runner) => (
                <tr key={runner.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/coach/runners/${runner.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {runner.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {runner.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {runner.goals.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {runner.healthLogsAsRunner.length > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        {runner.healthLogsAsRunner.length}
                      </span>
                    ) : (
                      <span className="text-gray-500">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {runner.reviews[0]
                      ? new Date(
                          runner.reviews[0].reviewedAt
                        ).toLocaleDateString()
                      : "Never"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
