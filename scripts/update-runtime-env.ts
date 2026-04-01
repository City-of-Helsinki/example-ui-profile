#!/usr/bin/env ts-node-script

import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';
import { config as dotenvConfig } from 'dotenv';
import { expand as dotenvExpand } from 'dotenv-expand';

const isTest = process.env.TEST === 'true';
const nodeEnv = process.env.NODE_ENV || (isTest ? 'test' : 'development');
process.env.NODE_ENV = nodeEnv;

const configFile = isTest ? 'test-env-config.js' : 'env-config.js';
const root = path.resolve(__dirname, '..');

// Load .env files in priority order (.env first, .env.{NODE_ENV} overrides)
const envFiles = [path.join(root, '.env'), path.join(root, `.env.${nodeEnv}`)];
for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    dotenvExpand(dotenvConfig({ path: envFile, override: true }));
  }
}

// Collect NODE_ENV + REACT_APP_* vars
const raw: Record<string, string | undefined> = { NODE_ENV: nodeEnv };
Object.keys(process.env).forEach(key => {
  if (key.startsWith('REACT_APP_')) {
    raw[key] = process.env[key];
  }
});

const configurationFile = path.join(root, 'public', configFile);

fs.writeFile(
  configurationFile,
  'window._env_ = ' + util.inspect(raw, false, 2, false),
  err => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log('File created!');
  }
);
