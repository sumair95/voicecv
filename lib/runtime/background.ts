/**
 * Deliberately-detached background work (M2).
 *
 * `/api/generate-cv` kicks off two jobs it does not await — profile seeding and
 * the multi-model competition — so the user gets their CV without waiting for
 * either. That is a correct trade-off, but it rests on an unstated assumption:
 * the Node process outlives the response.
 *
 * On Railway (a long-lived container, our production target) it does. On a
 * serverless platform the process is frozen the moment the response is flushed,
 * so the work is dropped — and dropped *silently*, which is the actual problem
 * the audit flagged. A competition that never runs looks identical to one that
 * ran and found no improvement.
 *
 * Next 15's `after()` would let the runtime hold the invocation open, but we're
 * on Next 14.2 where it isn't available. So this module takes the audit's other
 * branch — pin the deployment target and document it — and adds the piece that
 * makes pinning safe: if the assumption is ever violated, it says so loudly
 * instead of failing quietly.
 *
 * See README ("Deployment target") for the operational contract.
 */

import { logger } from "@/lib/log";

/**
 * Platforms that freeze or kill the process once the response is sent. Detected
 * from the platform's own injected env vars, so this needs no configuration.
 */
function serverlessPlatform(): string | null {
  if (process.env.VERCEL) return "vercel";
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return "aws-lambda";
  if (process.env.FUNCTIONS_WORKER_RUNTIME) return "azure-functions";
  if (process.env.K_SERVICE) return "cloud-run";
  return null;
}

/**
 * Run `fn` detached from the request, with the failure modes made visible.
 *
 * - On a serverless platform: logs an error naming the job that is about to be
 *   dropped. The work is still attempted (it may complete if the response
 *   hasn't flushed), but the log is the signal that this deploy target is
 *   incompatible with the feature.
 * - Anywhere else: runs it, and routes a rejection to the logger so a crash in
 *   detached work can never surface as an unhandled rejection that takes the
 *   whole process down.
 */
export function runInBackground(
  label: string,
  fn: () => Promise<unknown>,
  context: Record<string, unknown> = {},
): void {
  const platform = serverlessPlatform();
  if (platform) {
    logger.error(
      "background job will be dropped — serverless platform freezes the process after the response",
      { job: label, platform, ...context },
    );
  }

  void (async () => {
    const startedAt = Date.now();
    try {
      await fn();
      logger.info("background job finished", {
        job: label,
        ms: Date.now() - startedAt,
        ...context,
      });
    } catch (err) {
      // Detached work has no caller to return an error to, so the log is the
      // only record that it failed. Never rethrow.
      logger.warn("background job failed", {
        job: label,
        ms: Date.now() - startedAt,
        err,
        ...context,
      });
    }
  })();
}
