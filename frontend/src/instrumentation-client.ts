import * as Sentry from "@sentry/nextjs";

import { sharedOptions } from "@/sentry.shared";

Sentry.init(sharedOptions);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
