import { ClientConfig } from './client/index';

function envValueToBoolean(
  value: string | undefined | boolean,
  defaultValue: boolean
): boolean {
  const strValue = String(value).toLowerCase();
  if (
    value === false ||
    strValue === '' ||
    strValue === 'false' ||
    strValue === '0'
  ) {
    return false;
  }
  if (value === true || strValue === 'true' || strValue === '1') {
    return true;
  }
  return defaultValue;
}

function createConfigFromEnv(): Partial<ClientConfig> {
  const url = String(window._env_[`REACT_APP_KEYCLOAK_URL`]);
  const realm = String(window._env_[`REACT_APP_KEYCLOAK_REALM`]);
  const tokenExchangePath =
    window._env_[`REACT_APP_KEYCLOAK_TOKEN_EXCHANGE_PATH`];
  const exampleApiTokenAudience =
    window._env_[`REACT_APP_KEYCLOAK_EXAMPLE_API_TOKEN_AUDIENCE`];
  const profileApiTokenAudience =
    window._env_[`REACT_APP_KEYCLOAK_PROFILE_API_TOKEN_AUDIENCE`];
  const scope = window._env_[`REACT_APP_KEYCLOAK_SCOPE`];
  const apiGrantType = window._env_[`REACT_APP_KEYCLOAK_API_TOKEN_GRANT_TYPE`];
  const apiPermission = window._env_[`REACT_APP_KEYCLOAK_API_TOKEN_PERMISSION`];
  return {
    realm,
    url,
    authority: realm ? `${url}/realms/${realm}` : url,
    clientId: String(window._env_[`REACT_APP_KEYCLOAK_CLIENT_ID`]),
    callbackPath: String(window._env_[`REACT_APP_KEYCLOAK_CALLBACK_PATH`]),
    logoutPath: window._env_[`REACT_APP_KEYCLOAK_LOGOUT_PATH`] || '/',
    silentAuthPath: window._env_[`REACT_APP_KEYCLOAK_SILENT_AUTH_PATH`],
    responseType: window._env_[`REACT_APP_KEYCLOAK_RESPONSE_TYPE`],
    scope,
    autoSignIn: envValueToBoolean(
      window._env_[`REACT_APP_KEYCLOAK_AUTO_SIGN_IN`],
      true
    ),
    automaticSilentRenew: envValueToBoolean(
      window._env_[`REACT_APP_KEYCLOAK_AUTO_SILENT_RENEW`],
      true
    ),
    enableLogging: envValueToBoolean(
      window._env_[`REACT_APP_KEYCLOAK_LOGGING`],
      false
    ),
    tokenExchangePath,
    exampleApiTokenAudience,
    profileApiTokenAudience,
    apiGrantType,
    apiPermission
  };
}

const uiConfig: { profileUIUrl: string } = {
  profileUIUrl: String(window._env_.REACT_APP_PROFILE_UI_URL)
};

const keycloakConfig = {
  ...createConfigFromEnv(),
  path: '/helsinkitunnistus',
  label: 'Helsinki-Tunnistus'
} as ClientConfig;

const isCallbackUrl = (route: string): boolean =>
  route === keycloakConfig.callbackPath;

export default {
  ui: uiConfig,
  keycloakConfig,
  isCallbackUrl
};
