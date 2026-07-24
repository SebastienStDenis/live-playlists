import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// Source maps upload only when SENTRY_AUTH_TOKEN, SENTRY_ORG, and
// SENTRY_PROJECT are all set, and the build still succeeds without them, so
// local and CI builds need no Sentry credentials. Setting them in Vercel is
// what turns minified frontend stack traces back into readable ones.
export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  // Tracing is off (tracesSampleRate 0) and Session Replay is unused, so the
  // SDK code behind both can be tree-shaken out of the browser bundle. The
  // onRouterTransitionStart hook stays a safe no-op with tracing removed.
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeTracing: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
    excludeReplayWorker: true,
  },
});
