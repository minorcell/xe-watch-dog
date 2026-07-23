import { z } from "zod";

import {
  beginSyncRun,
  commitGitHubSync,
  failSyncRun,
  SyncAlreadyRunningError,
  type SyncTrigger,
} from "@/lib/database";
import { getGitHubEnv } from "@/lib/env";
import { fetchOrganizationRepositories, GitHubApiError } from "@/lib/github";

export type SyncFailure = {
  code: string;
  message: string;
  httpStatus: number;
};

export function describeSyncFailure(error: unknown): SyncFailure {
  if (error instanceof SyncAlreadyRunningError) {
    return { code: "sync_already_running", message: error.message, httpStatus: 409 };
  }
  if (error instanceof GitHubApiError) {
    const authenticationFailure = error.status === 401 || error.status === 403;
    return {
      code: authenticationFailure ? "github_auth_failed" : "github_request_failed",
      message: error.message,
      httpStatus: 502,
    };
  }
  if (error instanceof z.ZodError) {
    return {
      code: "github_response_invalid",
      message: "GitHub 返回了无法识别的仓库数据",
      httpStatus: 502,
    };
  }
  if (error instanceof Error && error.message.includes("未配置")) {
    return { code: "configuration_error", message: error.message, httpStatus: 503 };
  }
  return { code: "sync_failed", message: "GitHub 同步失败", httpStatus: 500 };
}

export async function runGitHubSync(trigger: SyncTrigger) {
  const { GITHUB_ORG, GITHUB_TOKEN } = getGitHubEnv();
  const run = await beginSyncRun(trigger);

  try {
    const repositories = await fetchOrganizationRepositories({
      org: GITHUB_ORG,
      token: GITHUB_TOKEN,
    });
    const capturedAt = new Date().toISOString();
    return await commitGitHubSync(run.id, repositories, capturedAt);
  } catch (error) {
    const failure = describeSyncFailure(error);
    try {
      await failSyncRun(run.id, failure.code, failure.message);
    } catch (recordingError) {
      console.error("Failed to record GitHub sync failure", recordingError);
    }
    throw error;
  }
}
