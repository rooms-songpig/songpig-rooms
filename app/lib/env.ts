/**
 * Shared environment helpers for gating dev-only UI/features.
 *
 * We rely on NEXT_PUBLIC_APP_ENV so production builds can still
 * force-enable helpers when deployed to preview environments.
 * Defaults to treating anything except explicit "production" as dev.
 */
const appEnv = process.env.NEXT_PUBLIC_APP_ENV?.toLowerCase();

export const isDevEnvironment =
  process.env.NODE_ENV !== 'production' ||
  (appEnv !== undefined && appEnv !== 'production');

export const devHelpersEnabled =
  process.env.NEXT_PUBLIC_ENABLE_DEV_HELPERS === 'true' || isDevEnvironment;


