import { z } from "zod";

import { getGitHubEnv } from "@/lib/env";
import type { ConfiguredRepository } from "@/lib/watch-config";

const githubRepositorySchema = z.object({
  full_name: z.string(),
  html_url: z.url(),
  description: z.string().nullable(),
  stargazers_count: z.number().int().nonnegative(),
  forks_count: z.number().int().nonnegative(),
  open_issues_count: z.number().int().nonnegative(),
  archived: z.boolean(),
  private: z.boolean(),
  updated_at: z.iso.datetime(),
});

export type RepositoryStarStats = {
  fullName: string;
  url: string;
  projectName: string;
  topic: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  archived: boolean;
  private: boolean;
  visibility: "public" | "private";
  updatedAt: string;
};

export type RepositoryFetchError = {
  fullName: string;
  projectName: string;
  message: string;
  status: number;
};

function getErrorMessage(status: number, fallback: string) {
  if (status === 401) return "GitHub Token 无效";
  if (status === 403) return "GitHub API 请求受限";
  if (status === 404) return "仓库不存在或当前 Token 无权访问";
  return fallback || `GitHub API 请求失败 (${status})`;
}

export async function fetchRepositoryStarStats(repository: ConfiguredRepository): Promise<RepositoryStarStats> {
  const { GITHUB_TOKEN } = getGitHubEnv();
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "xe-watch-dog",
  };

  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`,
    {
      headers,
      next: { revalidate: 300, tags: ["github-repository-stats"] },
    },
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null;
    throw Object.assign(new Error(getErrorMessage(response.status, body?.message ?? "")), {
      status: response.status,
    });
  }

  const data = githubRepositorySchema.parse(await response.json());

  return {
    fullName: data.full_name,
    url: data.html_url,
    projectName: repository.projectName,
    topic: repository.topic,
    description: data.description,
    stars: data.stargazers_count,
    forks: data.forks_count,
    openIssues: data.open_issues_count,
    archived: data.archived,
    private: data.private,
    visibility: data.private ? "private" : "public",
    updatedAt: data.updated_at,
  };
}

export async function fetchAllRepositoryStarStats(repositories: ConfiguredRepository[]) {
  const stats: RepositoryStarStats[] = [];
  const errors: RepositoryFetchError[] = [];
  const batchSize = 5;

  for (let index = 0; index < repositories.length; index += batchSize) {
    const batch = repositories.slice(index, index + batchSize);
    const results = await Promise.allSettled(batch.map(fetchRepositoryStarStats));

    results.forEach((result, resultIndex) => {
      const repository = batch[resultIndex];
      if (!repository) return;

      if (result.status === "fulfilled") {
        stats.push(result.value);
      } else {
        const error = result.reason as Error & { status?: number };
        errors.push({
          fullName: repository.fullName,
          projectName: repository.projectName,
          message: error.message,
          status: error.status ?? 500,
        });
      }
    });
  }

  return { stats, errors };
}
