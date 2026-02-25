"use client";

type RunnerData = {
  profile: Record<string, unknown> | null;
  personalBests: Record<string, unknown>[];
  goals: Record<string, unknown>[];
  healthLogsAsRunner: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
  createdAt: string;
};

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      {children}
    </div>
  );
}

export default function OverviewTab({ runner }: { runner: RunnerData }) {
  const profile = runner.profile;
  const activeGoals = runner.goals.filter(
    (g) => g.status === "ACTIVE"
  );
  const activeInjuries = runner.healthLogsAsRunner.filter(
    (h) => h.status === "ACTIVE"
  );

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card title="Training">
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-gray-500">Weekly Km:</span>{" "}
            {profile?.currentWeeklyKm?.toString() || "—"}
          </p>
          <p>
            <span className="text-gray-500">Days/Week:</span>{" "}
            {profile?.trainingDaysPerWeek?.toString() || "—"}
          </p>
          <p>
            <span className="text-gray-500">Years Running:</span>{" "}
            {profile?.yearsRunning?.toString() || "—"}
          </p>
        </div>
      </Card>

      <Card title="Goal Race">
        <div className="space-y-1 text-sm">
          <p className="font-medium">
            {(profile?.goalRace as string) || "No goal race set"}
          </p>
          {profile?.goalRaceDate ? (
            <p className="text-gray-500">
              {new Date(profile.goalRaceDate as string).toLocaleDateString()}
            </p>
          ) : null}
          {profile?.goalTime ? (
            <p className="text-gray-500">
              Target: {profile.goalTime as string}
            </p>
          ) : null}
        </div>
      </Card>

      <Card title="Active Goals">
        {activeGoals.length === 0 ? (
          <p className="text-sm text-gray-400">No active goals</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {activeGoals.slice(0, 3).map((g) => (
              <li key={g.id as string} className="truncate">
                {g.description as string}
              </li>
            ))}
            {activeGoals.length > 3 && (
              <li className="text-gray-400">
                +{activeGoals.length - 3} more
              </li>
            )}
          </ul>
        )}
      </Card>

      <Card title="PBs">
        {runner.personalBests.length === 0 ? (
          <p className="text-sm text-gray-400">No PBs recorded</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {runner.personalBests.slice(0, 4).map((pb) => (
              <li key={pb.id as string}>
                <span className="font-medium">{pb.distance as string}</span>{" "}
                <span className="text-gray-500">{pb.time as string}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Health">
        {activeInjuries.length === 0 ? (
          <p className="text-sm text-green-600">No active issues</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {activeInjuries.slice(0, 3).map((h) => (
              <li key={h.id as string} className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    h.severity === "SEVERE"
                      ? "bg-red-500"
                      : h.severity === "MODERATE"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                />
                <span className="truncate">
                  {h.bodyPart as string} — {h.description as string}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Equipment">
        <div className="space-y-1 text-sm">
          <p>
            HR Monitor:{" "}
            <span className={profile?.hasHrMonitor ? "text-green-600" : "text-gray-400"}>
              {profile?.hasHrMonitor ? "Yes" : "No"}
            </span>
          </p>
          <p>
            Gym:{" "}
            <span className={profile?.hasGymAccess ? "text-green-600" : "text-gray-400"}>
              {profile?.hasGymAccess ? "Yes" : "No"}
            </span>
          </p>
          <p>
            Track:{" "}
            <span className={profile?.hasTrackAccess ? "text-green-600" : "text-gray-400"}>
              {profile?.hasTrackAccess ? "Yes" : "No"}
            </span>
          </p>
        </div>
      </Card>
    </div>
  );
}
