import posthog from "posthog-js";

// instrumentation-client.ts runs very early, so we access env vars directly
// eslint-disable-next-line no-restricted-properties
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
// eslint-disable-next-line no-restricted-properties
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Cookieless tracking for privacy
    persistence: "memory",
    // Capture pageviews automatically
    capture_pageview: true,
    // Debug mode in development
    loaded: (ph) => {
      // eslint-disable-next-line no-restricted-properties
      if (process.env.NODE_ENV === "development") {
        ph.debug();
      }
    },
  });
}
