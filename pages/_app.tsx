import { NextComponentType, NextPageContext } from 'next';
import { NextRouter } from 'next/router';
import React from 'react';

import {
  attachRoutingContext,
  ErrorBoundary as TopLevelErrorBoundary,
} from '../src/utils/sentry/client';

export interface AppRenderProps {
  pageProps: object;
  err?: Error;
  Component?: NextComponentType<NextPageContext, AppRenderProps, object>;
  router?: NextRouter;
}

// eslint-disable-next-line import/no-default-export
export default function App({ Component, pageProps, router }: AppRenderProps) {
  if (!Component) {
    return null;
  }

  if (router) {
    attachRoutingContext(router, Component.name);
  }

  return (
    <TopLevelErrorBoundary showDialog>
      <Component {...pageProps} />
    </TopLevelErrorBoundary>
  );
}
