import React from 'react';
import { createRoot } from 'react-dom/client';
// eslint-disable-next-line import/no-namespace
import * as Sentry from '@sentry/browser';

import './index.css';
import BrowserApp from './BrowserApp';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _env_: any;
  }
}

const ENVS_WITH_SENTRY = ['staging', 'production'];

if (
  window._env_.REACT_APP_ENVIRONMENT &&
  ENVS_WITH_SENTRY.includes(window._env_.REACT_APP_ENVIRONMENT)
) {
  // Sentry 11 collects more data by default when dataCollection is unset.
  // Keep the restrictive Sentry 10 defaults, since this app handles
  // personal data and access tokens.
  const piiDenyList = ['forwarded', '-ip', 'remote-', 'via', '-user'];
  Sentry.init({
    dsn: window._env_.REACT_APP_SENTRY_DSN,
    environment: window._env_.REACT_APP_ENVIRONMENT,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: {
        request: { deny: piiDenyList },
        response: { deny: piiDenyList },
      },
      httpBodies: [],
      urlQueryParams: { deny: piiDenyList },
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
      queues: false,
      graphQL: { document: false, variables: false },
    },
  });
}

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(<BrowserApp />);
}
