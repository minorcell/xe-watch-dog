import { z } from "zod";

import { getGitHubEnv } from "@/lib/env";
import type { ConfiguredRepository } from "@/lib/watch-config";

// ── Repo stats (Star tracking) ────────────────────────────────

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

function githubHeaders(): HeadersInit {
  const { GITHUB_TOKEN } = getGitHubEnv();
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "xe-watch-dog",
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  return headers;
}

function getErrorMessage(status: number, fallback: string) {
  if (status === 401) return "GitHub Token 无效";
  if (status === 403) return "GitHub API 请求受限";
  if (status === 404) return "仓库不存在或当前 Token 无权访问";
  return fallback || `GitHub API 请求失败 (${status})`;
}

export async function fetchRepositoryStarStats(repository: ConfiguredRepository): Promise<RepositoryStarStats> {
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`,
    { headers: githubHeaders(), next: { revalidate: 300, tags: ["github-repository-stats"] } },
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

// ── Org repos list (paginated) ────────────────────────────────

export type OrgRepoSummary = {
  githubRepo: string;
  description: string | null;
  homepageUrl: string | null;
  topics: string[];
  language: string | null;
  visibility: string;
  archived: boolean;
};

export async function fetchOrgRepos(org: string): Promise<OrgRepoSummary[]> {
  const all: OrgRepoSummary[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `https://api.github.com/orgs/${encodeURIComponent(org)}/repos?per_page=${perPage}&page=${page}&sort=full_name`;
    const response = await fetch(url, { headers: githubHeaders() });

    if (!response.ok) {
      throw new Error(`GitHub API error ${response.status} listing org repos`);
    }

    const data = await response.json() as Array<{
      full_name: string;
      description: string | null;
      homepage: string | null;
      topics: string[];
      language: string | null;
      visibility: string;
      archived: boolean;
    }>;

    for (const r of data) {
      all.push({
        githubRepo: r.full_name,
        description: r.description ?? null,
        homepageUrl: r.homepage ?? null,
        topics: r.topics ?? [],
        language: r.language ?? null,
        visibility: r.visibility ?? "unknown",
        archived: r.archived ?? false,
      });
    }

    if (data.length < perPage) break;
    page++;
  }

  return all;
}

// ── Repo metadata for sync ────────────────────────────────────

export type RepoMetadata = {
  description: string | null;
  homepageUrl: string | null;
  topics: string[];
  language: string | null;
  visibility: string;
  archived: boolean;
};

export async function fetchRepoMetadata(owner: string, repo: string): Promise<RepoMetadata> {
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    { headers: githubHeaders() },
  );
  if (!response.ok) throw new Error(`GitHub API error ${response.status} for ${owner}/${repo}`);

  const data = await response.json() as {
    description: string | null; homepage: string | null; topics: string[];
    language: string | null; visibility: string; archived: boolean;
  };

  return {
    description: data.description ?? null, homepageUrl: data.homepage ?? null,
    topics: data.topics ?? [], language: data.language ?? null,
    visibility: data.visibility ?? "unknown", archived: data.archived ?? false,
  };
}

