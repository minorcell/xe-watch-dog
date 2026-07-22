import { readFile } from "node:fs/promises";
import path from "node:path";

import { cache } from "react";
import { parse } from "yaml";
import { z } from "zod";

import { getMonitoredRepos, isOrgDataAvailable, listRepos } from "@/lib/database";

const personSchema = z.object({
  name: z.string().trim(),
  id: z.string().trim(),
});

const groupSchema = z.object({
  project_name: z.string().trim().min(1),
  topic: z.string().trim().min(1),
  mentor: personSchema,
  assistant: personSchema,
  github_repo: z.string().trim(),
  github_team: z.string().trim(),
  members: z.array(personSchema),
});

const watchConfigSchema = z.object({ groups: z.array(groupSchema).min(1) });

export type WatchConfig = z.infer<typeof watchConfigSchema>;

export type ConfiguredRepository = {
  owner: string;
  name: string;
  fullName: string;
  url: string;
  projectName: string;
  topic: string;
};

const configPath = path.join(process.cwd(), "app", "data", "info.yaml");

/** YAML config (import / fallback only) */
export const getWatchConfig = cache(async (): Promise<WatchConfig> => {
  const source = await readFile(configPath, "utf8");
  return watchConfigSchema.parse(parse(source));
});

function parseRepo(fullRepo: string) {
  const [owner = "", name = ""] = fullRepo.split("/");
  return {
    owner,
    name: name.replace(/\.git$/, ""),
    fullName: fullRepo,
    url: `https://github.com/${fullRepo}`,
  };
}

/** Primary: read monitored repos from DB. Fallback: YAML. */
export const getConfiguredRepositories = cache(async (): Promise<ConfiguredRepository[]> => {
  // DB first
  if (await isOrgDataAvailable()) {
    const repos = await getMonitoredRepos();
    return repos.map((r) => {
      const info = parseRepo(r);
      return { ...info, projectName: r, topic: "" };
    });
  }

  // YAML fallback
  const config = await getWatchConfig();
  return config.groups.flatMap((g) => {
    if (!g.github_repo) return [];
    try {
      const url = new URL(g.github_repo);
      const [owner = "", rawName = ""] = url.pathname.split("/").filter(Boolean);
      const name = rawName.replace(/\.git$/, "");
      return [{ owner, name, fullName: `${owner}/${name}`, url: g.github_repo, projectName: g.project_name, topic: g.topic }];
    } catch { return []; }
  });
});
