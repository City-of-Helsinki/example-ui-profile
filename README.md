# Example-profile-ui

Example UI application handles logins to OIDC provider and loads Helsinki
Profile.

App uses [oidc-react.js](https://github.com/IdentityModel/oidc-client-js/wiki) for all calls to the OIDC provider. Library is
wrapped with "client" (client/index.ts) to unify connections to Keycloak
server and Profiili API.

Included in this demo app:

- two login types
- hooks for easy usage with React
- redux store listening a client
- HOC component listening a client and showing different content for authorized
  and unauthorized users.
- getting API token and using it to get Profile

Client dispatches events and trigger changes which then trigger re-rendering of
the components using the client.

## Config

Configs are in .env -files.

Config can also be overridden for command line:

```bash
REACT_APP_KEYCLOAK_URL="https://foo.bar"
```

### Environment variables

Scripts generates first environment variables to `public/env-config.js` with
`scripts/update-runtime-env.ts`, which contains the actual used variables when
running the app. App is not using CRA's default `process.env` way to refer of
variables but `window._env_` object.

Note that running built application locally you need to generate also `public/env-config.js` file. It can be done with
`yarn update-runtime-env`. By default it's generated for development environment if no `NODE_ENV` is set.

### Config for Helsinki-tunnistus

Settings when using Helsinki-tunnistus authentication:

```bash
REACT_APP_KEYCLOAK_URL="<SERVER_URL>/auth"
REACT_APP_KEYCLOAK_REALM="helsinki-tunnistus"
REACT_APP_KEYCLOAK_SCOPE="profile"
REACT_APP_KEYCLOAK_CLIENT_ID="exampleapp-ui"
```

Keys are the same, but with "\_OIDC\_" replaced by "\_KEYCLOAK\_".

### Config for getting Profile data

#### Helsinki-tunnistus

Use same config as above with Helsinki-tunnistus and add

```bash
REACT_APP_KEYCLOAK_SCOPE="openid profile email"
REACT_APP_KEYCLOAK_PROFILE_API_TOKEN_AUDIENCE="https://api.hel.fi/auth/helsinkiprofiledev"
REACT_APP_KEYCLOAK_API_TOKEN_GRANT_TYPE="api token grant type in Helsinki-Tunnistus"
REACT_APP_KEYCLOAK_API_TOKEN_PERMISSION="api token permission in Helsinki-Tunnistus"
```

### Config for getting Example backend data

#### Helsinki-tunnistus

This server uses the audience, grant type and permission.

```bash
REACT_APP_KEYCLOAK_EXAMPLE_API_TOKEN_AUDIENCE="example api token audience in Helsinki-Tunnistus"
REACT_APP_KEYCLOAK_API_TOKEN_GRANT_TYPE="api token grant type in Helsinki-Tunnistus"
REACT_APP_KEYCLOAK_API_TOKEN_PERMISSION="api token permission in Helsinki-Tunnistus"
```

## Docker

Docker image has ".env"-file baked in, so it uses production environment variables by default. To make the image work in other environments, env vars must be overridden.

You can pass new env vars easily with '--env-file' argument. Of course '-e' works too.

### Docker run

```
docker run --env-file=.env.development -p 3000:8080 helsinki/example-ui-profile
```

### Docker compose

Note that the composed build will stop to the 'development' stage in Dockerfile and uses 'react-scripts start' command and not nginx.

The env-file is fixed to '.env.development" in the 'docker-compose.yml'.

```
docker compose up
```

Env vars can be overridden in the yaml-file.

Example:

```yml
services:
  app:
    environment:
      - REACT_APP_OIDC_URL=https://foo.bar
```

## Testing

### yarn test

Runs tests in watch mode.

Scripts generates first environment variables to `public/test-env-config.js` with `scripts/update-runtime-env.ts`, which contains the
actual used variables when running the app. App is not using CRA's default `process.env` way to refer of variables but
`window._env_` object.

### yarn test:coverage

Runs tests with coverage outputted to console. Results are saved to /coverage Note: command is run with "CI=true". Remove this to get visually clearer results (with colors!).

### yarn test:coverage-for-sonar

(Legacy)
Runs tests with coverage and its results are saved as an xml file by jest-sonar-reporter.
This file can be sent to Sonar with Sonar Scanner (CLI). Report is /reports

### yarn update-runtime-env

Generates variable object used when app is running. Generated object is stored at `public/env-config.js` and available
as `window._env_` object.

Generation uses `react-scripts` internals, so values come from either environment variables or files (according
[react-scripts documentation](https://create-react-app.dev/docs/adding-custom-environment-variables/#what-other-env-files-can-be-used)).

## Logging in locally with Keycloak and using non-chromium browser

Firefox and Safari are stricter with third-party cookies and therefore session
checks in iframes fail with Firefox and Safari, when using localhost with
Keycloak. Login works, but session checks fail immediately.

Third party cookies are not an issue, when service is deployed and servers have
same top level domains like \*.hel.ninja. The problem occurs locally,
because http://localhost:3000 is communicating with https://\*.dev.hel.ninja.

More info about Firefox:
https://developer.mozilla.org/en-US/docs/Web/Privacy/Storage_Access_Policy/Errors/CookiePartitionedForeign

Issue can be temporarily resolved with:
https://developer.mozilla.org/en-US/docs/Web/Privacy/State_Partitioning#disable_dynamic_state_partitioning

With Safari, go to "Settings" -> "Privacy" -> uncheck "Prevent cross-site tracking"
