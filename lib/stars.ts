import { getLatestSnapshotRun, getLatestStarSnapshots, getStarSnapshots, isDatabaseConfigured, saveStarSnapshots } from "@/lib/database";
import type { DateRange } from "@/lib/date-range";
import { fetchAllRepositoryStarStats } from "@/lib/github";
import { getConfiguredRepositories } from "@/lib/watch-config";

export async function collectStarSnapshots() {
  if (!isDatabaseConfigured()) throw new Error("DATABASE_URL 尚未配置");

  const repositories = await getConfiguredRepositories();
  const result = await fetchAllRepositoryStarStats(repositories);

  const run = await saveStarSnapshots(result.stats, result.errors.length);

  return {
    saved: result.stats.length,
    failed: result.errors.length,
    errors: result.errors,
    capturedAt: run.capturedAt,
  };
}

export async function getStarDashboardData(range: DateRange) {
  const repositories = await getConfiguredRepositories();
  const [snapshots, latestSnapshots, latestRun] = await Promise.all([
    getStarSnapshots(range.from, range.to),
    getLatestStarSnapshots(),
    getLatestSnapshotRun(),
  ]);

  const snapshotsByRepository = new Map<string, typeof snapshots>();
  snapshots.forEach((snapshot) => {
    const current = snapshotsByRepository.get(snapshot.repository) ?? [];
    current.push(snapshot);
    snapshotsByRepository.set(snapshot.repository, current);
  });

  const latestByRepository = new Map(latestSnapshots.map((snapshot) => [snapshot.repository, snapshot]));

  const leaderboard = repositories.map((repository) => {
    const current = latestByRepository.get(repository.fullName);
    const history = snapshotsByRepository.get(repository.fullName) ?? [];
    const growth = history.length >= 2 ? history.at(-1)!.stars - history[0].stars : null;

    return {
      fullName: repository.fullName,
      projectName: repository.projectName,
      topic: repository.topic,
      url: current?.url ?? repository.url,
      visibility: current?.visibility ?? "unknown",
      stars: current?.stars ?? null,
      growth,
      forks: current?.forks ?? null,
      openIssues: current?.openIssues ?? null,
      updatedAt: current?.updatedAt ?? null,
      capturedAt: current?.capturedAt ?? null,
    };
  }).sort((left, right) => (right.stars ?? -1) - (left.stars ?? -1));

  const chartRepositories = leaderboard
    .filter((repository) => repository.stars !== null)
    .map((repository) => repository.fullName);

  const chartTimestamps = [...new Set(snapshots.map((snapshot) => snapshot.capturedAt))];
  const chartData = chartTimestamps.map((capturedAt) => {
    const point: Record<string, string | number | null> = { capturedAt };
    chartRepositories.forEach((repository) => {
      point[repository] = snapshots.find((snapshot) => snapshot.capturedAt === capturedAt && snapshot.repository === repository)?.stars ?? null;
    });
    return point;
  });

  const repositoriesWithSnapshots = leaderboard.filter((repository) => repository.capturedAt !== null);

  return {
    leaderboard,
    chartData,
    chartRepositories,
    databaseConfigured: isDatabaseConfigured(),
    repositoryCount: repositories.length,
    successfulRepositoryCount: repositoriesWithSnapshots.length,
    totalStars: leaderboard.reduce((total, repository) => total + (repository.stars ?? 0), 0),
    totalGrowth: leaderboard.reduce((total, repository) => total + (repository.growth ?? 0), 0),
    failedRepositoryCount: latestRun?.failureCount ?? 0,
    lastSnapshotAt: latestRun?.capturedAt ?? latestSnapshots.at(-1)?.capturedAt ?? null,
    rangeLabel: range.label,
  };
}

export type StarDashboardData = Awaited<ReturnType<typeof getStarDashboardData>>;
export type StarLeaderboardRow = StarDashboardData["leaderboard"][number];
