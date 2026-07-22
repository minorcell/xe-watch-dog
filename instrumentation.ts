/**
 * Next.js instrumentation hook — runs at server startup.
 * Used here to start the internal cron scheduler for self-hosted/Docker.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startInternalScheduler } = await import("./lib/internal-scheduler");
    startInternalScheduler();
  }
}
