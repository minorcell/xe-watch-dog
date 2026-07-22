import { cache } from "react";

import { getMonitoredRepos } from "@/lib/database";

export type ConfiguredRepository = {
  owner: string;
  name: string;
  fullName: string;
  url: string;
  projectName: string;
  topic: string;
};

function parseRepo(fullRepo: string) {
  const [owner = "", name = ""] = fullRepo.split("/");
  return {
    owner,
    name: name.replace(/\.git$/, ""),
    fullName: fullRepo,
    url: `https://github.com/${fullRepo}`,
  };
}

/** Read monitored repos from DB. */
export const getConfiguredRepositories = cache(async (): Promise<ConfiguredRepository[]> => {
  const repos = await getMonitoredRepos();
  return repos.map((r) => {
    const info = parseRepo(r);
    return { ...info, projectName: r, topic: "" };
  });
});
