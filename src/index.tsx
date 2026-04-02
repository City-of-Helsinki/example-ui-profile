import React from 'react';
import ReactDOM from 'react-dom';
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

ReactDOM.render(<BrowserApp />, document.getElementById('root'));

