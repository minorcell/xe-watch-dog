import assert from "node:assert/strict";
import test from "node:test";

import { fetchOrganizationRepositories, GitHubApiError } from "@/lib/github";

function rawRepository(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    name: `repo-${id}`,
    full_name: `example/repo-${id}`,
    html_url: `https://github.com/example/repo-${id}`,
    description: null,
    homepage: "",
    topics: [],
    language: null,
    visibility: "public",
    archived: false,
    stargazers_count: id,
    forks_count: 0,
    updated_at: "2026-07-23T00:00:00Z",
    pushed_at: null,
    ...overrides,
  };
}

test("fetches every page and preserves GitHub identity and internal visibility", async () => {
  const requests: URL[] = [];
  const firstPage = Array.from({ length: 100 }, (_, index) => rawRepository(index + 1));
  const secondPage = [rawRepository(101, { visibility: "internal", homepage: "https://example.com" })];

  const repositories = await fetchOrganizationRepositories({
    org: "example",
    token: "token",
    fetcher: async (input) => {
      const url = new URL(String(input));
      requests.push(url);
      return Response.json(url.searchParams.get("page") === "1" ? firstPage : secondPage);
    },
  });

  assert.equal(requests.length, 2);
  assert.equal(requests[0].searchParams.get("type"), "all");
  assert.equal(repositories.length, 101);
  assert.deepEqual(repositories.at(-1), {
    githubId: 101,
    name: "repo-101",
    fullName: "example/repo-101",
    htmlUrl: "https://github.com/example/repo-101",
    description: null,
    homepageUrl: "https://example.com",
    topics: [],
    language: null,
    visibility: "internal",
    archived: false,
    stars: 101,
    forks: 0,
    githubUpdatedAt: "2026-07-23T00:00:00Z",
    pushedAt: null,
  });
});

test("rejects duplicate GitHub repository IDs", async () => {
  await assert.rejects(
    fetchOrganizationRepositories({
      org: "example",
      token: "token",
      fetcher: async () => Response.json([
        rawRepository(1),
        rawRepository(1, { full_name: "example/renamed" }),
      ]),
    }),
    /重复仓库 ID/,
  );
});

test("maps GitHub authorization failures", async () => {
  await assert.rejects(
    fetchOrganizationRepositories({
      org: "example",
      token: "invalid",
      fetcher: async () => Response.json({ message: "Forbidden" }, { status: 403 }),
    }),
    (error) => error instanceof GitHubApiError
      && error.status === 403
      && error.message.includes("权限不足"),
  );
});
