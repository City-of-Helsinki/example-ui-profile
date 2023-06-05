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

function createConfigFromEnv(
  source: 'OIDC' | 'KEYCLOAK'
): Partial<ClientConfig> {
  const url = String(window._env_[`REACT_APP_${source}_URL`]);
  const realm = String(window._env_[`REACT_APP_${source}_REALM`]);
  const tokenExchangePath =
    window._env_[`REACT_APP_${source}_TOKEN_EXCHANGE_PATH`];
  const exampleApiTokenAudience =
    window._env_[`REACT_APP_${source}_EXAMPLE_API_TOKEN_AUDIENCE`];
  const profileApiTokenAudience =
    window._env_[`REACT_APP_${source}_PROFILE_API_TOKEN_AUDIENCE`];
  const scope = window._env_[`REACT_APP_${source}_SCOPE`];
  const apiGrantType = window._env_[`REACT_APP_${source}_API_TOKEN_GRANT_TYPE`];
  const apiPermission =
    window._env_[`REACT_APP_${source}_API_TOKEN_PERMISSION`];
  return {
    realm,
    url,
    authority: realm ? `${url}/realms/${realm}` : url,
    clientId: String(window._env_[`REACT_APP_${source}_CLIENT_ID`]),
    callbackPath: String(window._env_[`REACT_APP_${source}_CALLBACK_PATH`]),
    logoutPath: window._env_[`REACT_APP_${source}_LOGOUT_PATH`] || '/',
    silentAuthPath: window._env_[`REACT_APP_${source}_SILENT_AUTH_PATH`],
    responseType: window._env_[`REACT_APP_${source}_RESPONSE_TYPE`],
    scope,
    autoSignIn: envValueToBoolean(
      window._env_[`REACT_APP_${source}_AUTO_SIGN_IN`],
      true
    ),
    automaticSilentRenew: envValueToBoolean(
      window._env_[`REACT_APP_${source}_AUTO_SILENT_RENEW`],
      true
    ),
    enableLogging: envValueToBoolean(
      window._env_[`REACT_APP_${source}_LOGGING`],
      false
    ),
    tokenExchangePath,
    exampleApiTokenAudience,
    profileApiTokenAudience,
    apiGrantType,
    apiPermission
  };
}

const tunnistamoConfig = {
  ...createConfigFromEnv('OIDC'),
  path: '/tunnistamo',
  label: 'Tunnistamo'
} as ClientConfig;

const uiConfig: { profileUIUrl: string } = {
  profileUIUrl: String(window._env_.REACT_APP_PROFILE_UI_URL)
};

const keycloakConfig = {
  ...createConfigFromEnv('KEYCLOAK'),
  path: '/helsinkitunnistus',
  label: 'Helsinki-Tunnistus'
} as ClientConfig;

const isCallbackUrl = (route: string): boolean =>
  route === tunnistamoConfig.callbackPath ||
  route === keycloakConfig.callbackPath;

const getConfigFromRoute = (route: string): ClientConfig | undefined => {
  if (route.length < 2) {
    return undefined;
  }
  if (
    route.includes(tunnistamoConfig.path) ||
    route === tunnistamoConfig.callbackPath
  ) {
    return tunnistamoConfig;
  }
  return keycloakConfig;
};

export default {
  tunnistamoConfig,
  ui: uiConfig,
  keycloakConfig,
  isCallbackUrl,
  getConfigFromRoute
};
