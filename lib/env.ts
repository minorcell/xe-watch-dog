import { z } from "zod";

const authEnvSchema = z.object({
  ADMIN_PASSWORD_HASH: z.string().min(20).optional(),
  ADMIN_PASSWORD_HASH_B64: z.string().min(40).optional(),
  AUTH_SECRET: z.string().min(32),
}).superRefine((value, context) => {
  if (!value.ADMIN_PASSWORD_HASH && !value.ADMIN_PASSWORD_HASH_B64) {
    context.addIssue({ code: "custom", path: ["ADMIN_PASSWORD_HASH"], message: "Set ADMIN_PASSWORD_HASH or ADMIN_PASSWORD_HASH_B64" });
  }
});

const githubEnvSchema = z.object({
  GITHUB_TOKEN: z.string().min(1).optional(),
});

const databaseUrlSchema = z.url();

const cronSecretSchema = z.string().min(24);

export function getAuthEnv() {
  const env = authEnvSchema.parse({
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    ADMIN_PASSWORD_HASH_B64: process.env.ADMIN_PASSWORD_HASH_B64,
    AUTH_SECRET: process.env.AUTH_SECRET,
  });

  return {
    AUTH_SECRET: env.AUTH_SECRET,
    ADMIN_PASSWORD_HASH: env.ADMIN_PASSWORD_HASH_B64
      ? Buffer.from(env.ADMIN_PASSWORD_HASH_B64, "base64").toString("utf8")
      : env.ADMIN_PASSWORD_HASH!,
  };
}

export function getGitHubEnv() {
  return githubEnvSchema.parse({
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || undefined,
  });
}

export function getDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  return value ? databaseUrlSchema.parse(value) : null;
}

export function getCronSecret() {
  const value = process.env.CRON_SECRET;
  return value ? cronSecretSchema.parse(value) : null;
}
