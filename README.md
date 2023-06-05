# Example-profile-ui

Example UI application handles logins to OIDC provider and loads Helsinki Profile. There are two types of logins: Helsinki-Profiili MVP and Helsinki-tunnistus. User chooses one on the index page.

App uses [oidc-react.js](https://github.com/IdentityModel/oidc-client-js/wiki) for all calls to the OIDC provider. Library is wrapped with "client" (client/index.ts) to unify connections to Tunnistamo, Keycloak server and Profiili API.

Included in this demo app:

- two login types
- hooks for easy usage with React
- redux store listening a client
- HOC component listening a client and showing different content for authorized and unauthorized users.
- getting API token and using it to get Profile (only when using Helsinki-Profiili MVP ).

Client dispatches events and trigger changes which then trigger re-rendering of the components using the client.

## Config

Configs are in .env -files. Default endpoint for Helsinki-Profiili is Tunnistamo. For Suomi.fi authentication, it is plain Keycloak.

Tunnistamo does not support silent login checks (it uses only sessionStorage) so REACT_APP_OIDC_AUTO_SIGN_IN must be 'false'. It renews access tokens so REACT_APP_OIDC_SILENT_AUTH_PATH must be changed to '/' to prevent errors for unknown redirect url.

Config can also be overridden for command line:

```bash
REACT_APP_OIDC_URL="https://foo.bar"
```

### Environment variables

Scripts generates first environment variables to `public/env-config.js` with `scripts/update-runtime-env.ts`, which contains the
actual used variables when running the app. App is not using CRA's default `process.env` way to refer of variables but
`window._env_` object.

Note that running built application locally you need to generate also `public/env-config.js` file. It can be done with
`yarn update-runtime-env`. By default it's generated for development environment if no `NODE_ENV` is set.

### Config for Helsinki-Profiili MVP

Settings when using Helsinki-Profiili MVP authentication:

```bash
REACT_APP_OIDC_URL="<SERVER_URL>/auth"
REACT_APP_OIDC_REALM="helsinki-tunnistus"
REACT_APP_OIDC_SCOPE="profile"
REACT_APP_OIDC_CLIENT_ID="exampleapp-ui"
```

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

#### Tunnistamo

Use same config as above with Tunnistamo and add

```bash
REACT_APP_OIDC_SCOPE="openid profile email https://api.hel.fi/auth/helsinkiprofile"
REACT_APP_OIDC_PROFILE_API_TOKEN_AUDIENCE="https://api.hel.fi/auth/helsinkiprofiledev"
```

Tunnistamo does not use these, so leave them empty:

```bash
REACT_APP_OIDC_API_TOKEN_GRANT_TYPE=""
REACT_APP_OIDC_API_TOKEN_PERMISSION=""
```

#### Helsinki-tunnistus

Use same config as above with Helsinki-tunnistus and add

```bash
REACT_APP_KEYCLOAK_SCOPE="openid profile email"
REACT_APP_KEYCLOAK_PROFILE_API_TOKEN_AUDIENCE="https://api.hel.fi/auth/helsinkiprofiledev"
REACT_APP_KEYCLOAK_API_TOKEN_GRANT_TYPE="api token grant type in Helsinki-Tunnistus"
REACT_APP_KEYCLOAK_API_TOKEN_PERMISSION="api token permission in Helsinki-Tunnistus"
```

### Config for getting Example backend data

#### Tunnistamo

When getting api tokens, the Tunnistamo request does not need any props. But audiences are needed when getting the correct token in UI. Note that `REACT_APP_OIDC_SCOPE` must have scopes for the api token audiences when using Tunnistamo.

```bash
REACT_APP_OIDC_EXAMPLE_API_TOKEN_AUDIENCE="api token audience in Tunnistamo"
```

Tunnistamo does not use these, so leave them empty:

```bash
REACT_APP_OIDC_API_TOKEN_GRANT_TYPE=""
REACT_APP_OIDC_API_TOKEN_PERMISSION=""
```

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

### yarn test-coverage

Runs tests with coverage outputted to console. Results are saved to /coverage Note: command is run with "CI=true". Remove this to get visually clearer results (with colors!).

### yarn test-coverage-for-sonar

Runs tests with coverage and its results are saved as an xml file by jest-sonar-reporter.
This file can be sent to Sonar with Sonar Scanner (CLI). Report is /reports

### yarn update-runtime-env

Generates variable object used when app is running. Generated object is stored at `public/env-config.js` and available
as `window._env_` object.

Generation uses `react-scripts` internals, so values come from either environment variables or files (according
[react-scripts documentation](https://create-react-app.dev/docs/adding-custom-environment-variables/#what-other-env-files-can-be-used)).
