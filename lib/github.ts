import { z } from "zod";

const githubRepositorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  full_name: z.string().min(3),
  html_url: z.url(),
  description: z.string().nullable(),
  homepage: z.string().nullable(),
  topics: z.array(z.string()),
  language: z.string().nullable(),
  visibility: z.enum(["public", "private", "internal"]),
  archived: z.boolean(),
  stargazers_count: z.number().int().nonnegative(),
  forks_count: z.number().int().nonnegative(),
  updated_at: z.iso.datetime(),
  pushed_at: z.iso.datetime().nullable(),
});

const githubRepositoryPageSchema = z.array(githubRepositorySchema);

export type GitHubRepository = {
  githubId: number;
  name: string;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  homepageUrl: string | null;
  topics: string[];
  language: string | null;
  visibility: "public" | "private" | "internal";
  archived: boolean;
  stars: number;
  forks: number;
  githubUpdatedAt: string;
  pushedAt: string | null;
};

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export class GitHubApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

function githubHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "org-watch-dog",
  };
}

function getErrorMessage(status: number, fallback: string) {
  if (status === 401) return "GitHub Token 无效";
  if (status === 403) return "GitHub API 请求受限或 Token 权限不足";
  if (status === 404) return "GitHub 组织不存在或当前 Token 无权访问";
  return fallback || `GitHub API 请求失败 (${status})`;
}

export async function fetchOrganizationRepositories(input: {
  org: string;
  token: string;
  fetcher?: Fetcher;
}): Promise<GitHubRepository[]> {
  const fetcher = input.fetcher ?? fetch;
  const repositories: GitHubRepository[] = [];
  const perPage = 100;

  for (let page = 1; ; page++) {
    const url = new URL(`https://api.github.com/orgs/${encodeURIComponent(input.org)}/repos`);
    url.searchParams.set("type", "all");
    url.searchParams.set("sort", "full_name");
    url.searchParams.set("direction", "asc");
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("page", String(page));

    const response = await fetcher(url, {
      headers: githubHeaders(input.token),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null) as { message?: string } | null;
      throw new GitHubApiError(
        getErrorMessage(response.status, body?.message ?? ""),
        response.status,
      );
    }

    const pageRepositories = githubRepositoryPageSchema.parse(await response.json());
    for (const repository of pageRepositories) {
      repositories.push({
        githubId: repository.id,
        name: repository.name,
        fullName: repository.full_name,
        htmlUrl: repository.html_url,
        description: repository.description,
        homepageUrl: repository.homepage || null,
        topics: repository.topics,
        language: repository.language,
        visibility: repository.visibility,
        archived: repository.archived,
        stars: repository.stargazers_count,
        forks: repository.forks_count,
        githubUpdatedAt: repository.updated_at,
        pushedAt: repository.pushed_at,
      });
    }

    if (pageRepositories.length < perPage) break;
  }

  const ids = new Set<number>();
  const fullNames = new Set<string>();
  for (const repository of repositories) {
    if (ids.has(repository.githubId)) {
      throw new Error(`GitHub 返回重复仓库 ID: ${repository.githubId}`);
    }
    if (fullNames.has(repository.fullName)) {
      throw new Error(`GitHub 返回重复仓库名称: ${repository.fullName}`);
    }
    ids.add(repository.githubId);
    fullNames.add(repository.fullName);
  }

  return repositories;
}
