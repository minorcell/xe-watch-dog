import {
  getLatestMetricSnapshots,
  getLatestSyncRun,
  getMetricSnapshots,
  isDatabaseConfigured,
  listMonitoredRepositories,
} from "@/lib/database";
import type { DateRange, SnapshotGranularity } from "@/lib/date-range";

export async function getStarDashboardData(range: DateRange, granularity: SnapshotGranularity = "day") {
  if (!isDatabaseConfigured()) {
    return {
      leaderboard: [],
      chartData: [],
      chartRepositories: [],
      databaseConfigured: false,
      repositoryCount: 0,
      successfulRepositoryCount: 0,
      staleRepositoryCount: 0,
      totalStars: 0,
      totalGrowth: 0,
      lastSnapshotAt: null,
      latestRun: null,
      latestSuccessfulRun: null,
      rangeLabel: range.label,
      granularity,
    };
  }

  const [repositories, snapshots, latestSnapshots, latestRun, latestSuccessfulRun] = await Promise.all([
    listMonitoredRepositories(),
    getMetricSnapshots(range.from, range.to, granularity),
    getLatestMetricSnapshots(),
    getLatestSyncRun(),
    getLatestSyncRun({ completedOnly: true }),
  ]);

  const snapshotsByRepository = new Map<number, typeof snapshots>();
  for (const snapshot of snapshots) {
    const current = snapshotsByRepository.get(snapshot.githubId) ?? [];
    current.push(snapshot);
    snapshotsByRepository.set(snapshot.githubId, current);
  }

  const latestByRepository = new Map(
    latestSnapshots.map((snapshot) => [snapshot.githubId, snapshot]),
  );

  const leaderboard = repositories.map((repository) => {
    const current = latestByRepository.get(repository.githubId);
    const history = snapshotsByRepository.get(repository.githubId) ?? [];
    const growth = history.length >= 2 ? history.at(-1)!.stars - history[0].stars : null;
    const freshness = !current
      ? "never" as const
      : current.runId === latestSuccessfulRun?.id
        ? "current" as const
        : "stale" as const;

    return {
      githubId: repository.githubId,
      fullName: repository.fullName,
      url: repository.htmlUrl,
      visibility: repository.visibility,
      archived: repository.archived,
      unavailableAt: repository.unavailableAt,
      stars: current?.stars ?? null,
      growth,
      forks: current?.forks ?? null,
      capturedAt: current?.capturedAt ?? null,
      freshness,
    };
  }).sort((left, right) => (right.stars ?? -1) - (left.stars ?? -1));

  const chartRepositories = leaderboard
    .filter((repository) => repository.stars !== null)
    .map((repository) => repository.fullName);

  const snapshotsByTimestamp = new Map<string, Map<string, number>>();
  for (const snapshot of snapshots) {
    const point = snapshotsByTimestamp.get(snapshot.capturedAt) ?? new Map<string, number>();
    point.set(snapshot.repository, snapshot.stars);
    snapshotsByTimestamp.set(snapshot.capturedAt, point);
  }

  const chartData = [...snapshotsByTimestamp.entries()].map(([capturedAt, values]) => {
    const point: Record<string, string | number | null> = { capturedAt };
    for (const repository of chartRepositories) {
      point[repository] = values.get(repository) ?? null;
    }
    return point;
  });

  const currentRepositories = leaderboard.filter((repository) => repository.freshness === "current");
  const staleRepositories = leaderboard.filter((repository) => repository.freshness === "stale");

  return {
    leaderboard,
    chartData,
    chartRepositories,
    databaseConfigured: true,
    repositoryCount: repositories.length,
    successfulRepositoryCount: currentRepositories.length,
    staleRepositoryCount: staleRepositories.length,
    totalStars: leaderboard.reduce((total, repository) => total + (repository.stars ?? 0), 0),
    totalGrowth: leaderboard.reduce((total, repository) => total + (repository.growth ?? 0), 0),
    lastSnapshotAt: latestSuccessfulRun?.capturedAt ?? null,
    latestRun,
    latestSuccessfulRun,
    rangeLabel: range.label,
    granularity,
  };
}

export type StarDashboardData = Awaited<ReturnType<typeof getStarDashboardData>>;
export type StarLeaderboardRow = StarDashboardData["leaderboard"][number];
