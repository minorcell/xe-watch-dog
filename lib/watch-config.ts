import { readFile } from "node:fs/promises";
import path from "node:path";

import { cache } from "react";
import { parse } from "yaml";
import { z } from "zod";

import { isOrgDataAvailable, listGroups } from "@/lib/database";

const personSchema = z.object({
  name: z.string().trim(),
  id: z.string().trim(),
});

const repositoryUrlSchema = z.string().trim().refine(
  (value) => {
    if (value === "") return true;
    try {
      const url = new URL(value);
      const parts = url.pathname.split("/").filter(Boolean);
      return url.protocol === "https:" && url.hostname === "github.com" && parts.length === 2;
    } catch {
      return false;
    }
  },
  { message: "github_repo must be empty or a full GitHub repository URL" },
);

const groupSchema = z.object({
  project_name: z.string().trim().min(1),
  topic: z.string().trim().min(1),
  mentor: personSchema,
  assistant: personSchema,
  github_repo: repositoryUrlSchema,
  github_team: z.string().trim(),
  members: z.array(personSchema),
});

const watchConfigSchema = z.object({
  groups: z.array(groupSchema).min(1),
});

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

/** Read from YAML (only used as fallback when DB is empty) */
export const getWatchConfig = cache(async (): Promise<WatchConfig> => {
  const source = await readFile(configPath, "utf8");
  return watchConfigSchema.parse(parse(source));
});

/** Primary data source: reads repos from org_groups table. Falls back to YAML. */
export const getConfiguredRepositories = cache(async (): Promise<ConfiguredRepository[]> => {
  // Try database first
  const hasDbData = await isOrgDataAvailable();
  if (hasDbData) {
    const groups = await listGroups();
    return groups.flatMap((group) => {
      if (!group.githubRepo) return [];
      try {
        const url = new URL(group.githubRepo);
        const [owner = "", rawName = ""] = url.pathname.split("/").filter(Boolean);
        const name = rawName.replace(/\.git$/, "");
        return [
          {
            owner,
            name,
            fullName: `${owner}/${name}`,
            url: group.githubRepo,
            projectName: group.projectName,
            topic: group.projectTopic,
          },
        ];
      } catch {
        return [];
      }
    });
  }

  // Fallback to YAML
  const config = await getWatchConfig();
  return config.groups.flatMap((group) => {
    if (!group.github_repo) return [];
    const url = new URL(group.github_repo);
    const [owner = "", rawName = ""] = url.pathname.split("/").filter(Boolean);
    const name = rawName.replace(/\.git$/, "");
    return [
      {
        owner,
        name,
        fullName: `${owner}/${name}`,
        url: group.github_repo,
        projectName: group.project_name,
        topic: group.topic,
      },
    ];
  });
});

export async function getWatchConfigSummary() {
  const repositories = await getConfiguredRepositories();
  const config = await getWatchConfig().catch(() => ({ groups: [] }));

  return {
    groupCount: config.groups.length,
    repositoryCount: repositories.length,
    owners: [...new Set(repositories.map((repo) => repo.owner))],
  };
}
