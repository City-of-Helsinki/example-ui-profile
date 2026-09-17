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
  Sentry.init({
    dsn: window._env_.REACT_APP_SENTRY_DSN,
    environment: window._env_.REACT_APP_ENVIRONMENT,
  });
}

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(<BrowserApp />);
}
