import type { NextWebVitalsMetric } from 'next/app';
import type { NextRouter } from 'next/router';
import { useEffect } from 'react';

import { useScrollRestoration } from '../client/hooks/useScrollRestoration';
import type { KarmaComponent } from '../client/karma/layout';
import type { IsomorphicKarmaProps } from '../client/karma/types';
import {
  attachRoutingContext,
  ErrorBoundary as TopLevelErrorBoundary,
  configureScope,
} from '../utils/sentry/client';

export type AppRenderProps = {
  pageProps: unknown & { karma?: IsomorphicKarmaProps };
  err?: Error;
  Component: KarmaComponent;
  router: NextRouter;
};

// eslint-disable-next-line import/no-default-export
export default function App({
  Component,
  pageProps,
  router,
}: AppRenderProps): JSX.Element {
  useEffect(() => {
    attachRoutingContext(router);
  }, [router]);

  useScrollRestoration(router);

  const { withLayout } = Component;
  const { karma, ...rest } = pageProps;

  return (
    <TopLevelErrorBoundary showDialog>
      {withLayout ? (
        withLayout(<Component {...rest} />, karma)
      ) : (
        <Component {...pageProps} />
      )}
    </TopLevelErrorBoundary>
  );
}

/**
 * @see https://nextjs.org/docs/advanced-features/measuring-performance
 */
export const reportWebVitals = (metric: NextWebVitalsMetric): void => {
  // possible alternative implementation with an endpoint

  // const endpoint = '/analytics';
  // const body = JSON.stringify(metric);

  // if ('sendBeacon' in navigator) {
  //   navigator.sendBeacon(endpoint, body);
  // } else {
  //   fetch(endpoint, { keepalive: true, method: 'POST' });
  // }

  // this will _only_ send metrics for crashes
  configureScope((scope) => {
    const key = `web-vital-${metric.name.toLowerCase()}`;

    scope.setContext(key, metric);
  });
};
