import to from 'await-to-js';

export type User = Record<string, string | number | boolean>;
export type Token = string | undefined;
export type JWTPayload = Record<string, string>;
export type EventPayload =
  | User
  | undefined
  | Client
  | ClientStatusId
  | ClientErrorObject;
export type EventListener = (payload?: EventPayload) => void;
export type Client = {
  init: () => Promise<User | undefined | null>;
  login: () => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isInitialized: () => boolean;
  clearSession: () => void;
  handleCallback: () => Promise<User | undefined | Error>;
  getUser: () => User | undefined;
  getOrLoadUser: () => Promise<User | undefined | null>;
  loadUserProfile: () => Promise<User>;
  getStatus: () => ClientStatusId;
  setStatus: (newStatus: ClientStatusId) => boolean;
  getError: () => ClientErrorObject;
  setError: (newError?: ClientErrorObject) => boolean;
  getUserProfile: () => User | undefined;
  addListener: (
    eventType: ClientEventId,
    listener: EventListener
  ) => () => void;
  onAuthChange: (authenticated: boolean) => boolean;
  getApiAccessToken: (
    options: FetchApiTokenOptions
  ) => Promise<JWTPayload | FetchError>;
  getApiToken: (audience: string) => string | undefined;
  addApiTokens: (newToken: JWTPayload) => JWTPayload;
  removeApiToken: (audience: string) => JWTPayload;
  getUserTokens: () => Record<string, string | undefined> | undefined;
};

export const ClientStatus = {
  NONE: 'NONE',
  INITIALIZING: 'INITIALIZING',
  AUTHORIZED: 'AUTHORIZED',
  UNAUTHORIZED: 'UNAUTHORIZED'
} as const;

export type ClientStatusId = typeof ClientStatus[keyof typeof ClientStatus];

export type FetchApiTokenOptions = {
  audience: string;
};

export type FetchApiTokenConfiguration = FetchApiTokenOptions & {
  uri: string;
  accessToken: string;
};

export type FetchError = {
  status?: number;
  error?: Error;
  message?: string;
};

export const ClientEvent = {
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_EXPIRING: 'TOKEN_EXPIRING',
  ERROR: 'ERROR',
  STATUS_CHANGE: 'STATUS_CHANGE',
  AUTHORIZATION_TERMINATED: 'AUTHORIZATION_TERMINATED',
  LOGGING_OUT: 'LOGGING_OUT',
  USER_CHANGED: 'USER_CHANGED',
  ...ClientStatus
} as const;

export type ClientEventId = typeof ClientEvent[keyof typeof ClientEvent];

export const ClientError = {
  INIT_ERROR: 'INIT_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  AUTH_REFRESH_ERROR: 'AUTH_REFRESH_ERROR',
  LOAD_ERROR: 'LOAD_ERROR',
  UNEXPECTED_AUTH_CHANGE: 'UNEXPECTED_AUTH_CHANGE',
  USER_DATA_ERROR: 'USER_DATA_ERROR'
} as const;

export type ClientErrorObject = { type: string; message: string } | undefined;

export interface ClientConfig {
  /**
   * realm for the OIDC/OAuth2 endpoint
   */
  realm: string;
  /**
   * The URL of the OIDC/OAuth2 endpoint
   */
  url: string;
  /**
   * authority for the OIDC/OAuth2. Not configurable, value is props.url+'/realms/'+props.realm
   */
  authority: string;
  /**
   * Your client application's identifier as registered with the OIDC/OAuth2 provider.
   */
  clientId: string;
  /**
   * The redirect URI of your client application to receive a response from the OIDC/OAuth2 provider.
   */
  callbackPath: string;
  /**
   * The redirect URI of your client application after logout
   * Default: '/'
   */
  logoutPath?: string;
  /**
   * The path for silent authentication checks
   * Default '/silent-renew.html'
   */
  silentAuthPath?: string;
  /**
   * The type of response desired from the OIDC/OAuth2 provider.
   */
  responseType?: string;
  /**
   * The scope being requested from the OIDC/OAuth2 provider.
   */
  scope?: string;
  /**
   * Default: true
   */
  autoSignIn?: boolean;
  /**
   * Default: true
   */
  automaticSilentRenew?: boolean;
  /**
   * Default: false
   */
  enableLogging?: boolean;
  /**
   * Path for exchanging tokens. Leave blank to use default keycloak path realms/<realm>/protocol/openid-connect/token
   */
  tokenExchangePath?: string;
  /**
   * path prefix for this config type
   */
  path: string;
  /**
   * label of this config shown in the UI
   */
  label: string;
  /**
   * api token audience for example API
   */
  exampleApiTokenAudience: string;
  /**
   * api token audience for profile API
   */
  profileApiTokenAudience: string;
  /**
   * grantType sent to the api token server when getting tokens
   */
  apiGrantType: string;
  /**
   * permission sent to the api token server when getting tokens
   */
  apiPermission: string;
}

type EventHandlers = {
  addListener: Client['addListener'];
  eventTrigger: (eventType: ClientEventId, payload?: EventPayload) => void;
};

export type ClientFactory = {
  addListener: Client['addListener'];
  eventTrigger: EventHandlers['eventTrigger'];
  getStoredUser: () => User | undefined;
  setStoredUser: (newUser: User | undefined) => void;
  getStatus: Client['getStatus'];
  setStatus: Client['setStatus'];
  getError: Client['getError'];
  setError: Client['setError'];
  isInitialized: Client['isInitialized'];
  isAuthenticated: Client['isAuthenticated'];
  fetchApiToken: (
    options: FetchApiTokenConfiguration
  ) => Promise<JWTPayload | FetchError>;
  getApiToken: Client['getApiToken'];
  addApiTokens: Client['addApiTokens'];
  removeApiToken: Client['removeApiToken'];
} & EventHandlers;

export function createEventHandling(): EventHandlers {
  const listeners: Map<ClientEventId, Set<EventListener>> = new Map();
  const getListenerListForEventType = (
    eventType: ClientEventId
  ): Set<EventListener> => {
    if (!listeners.has(eventType)) {
      listeners.set(eventType, new Set());
    }
    return listeners.get(eventType) as Set<EventListener>;
  };

  const addListener: Client['addListener'] = (eventType, listener) => {
    const listenerList = getListenerListForEventType(eventType);
    listenerList.add(listener);
    return (): void => {
      const targetList = listeners.get(eventType);
      if (targetList) {
        targetList.delete(listener);
      }
    };
  };
  const eventTrigger = (
    eventType: ClientEventId,
    payload?: EventPayload
  ): void => {
    const source = listeners.get(eventType);
    if (source && source.size) {
      source.forEach(listener => listener(payload));
    }
  };
  return {
    addListener,
    eventTrigger
  };
}

export function createClient(): ClientFactory {
  let status: ClientStatusId = ClientStatus.NONE;
  let error: ClientErrorObject;
  let user: User | undefined;
  const tokenStorage: JWTPayload = {};
  const { addListener, eventTrigger } = createEventHandling();

  const getStoredUser = (): User | undefined => user;

  const setStoredUser = (newUser: User | undefined): void => {
    user = newUser;
  };

  const getStatus: Client['getStatus'] = () => status;

  const getError: Client['getError'] = () => error;

  const isAuthenticated: Client['isAuthenticated'] = () =>
    status === ClientStatus.AUTHORIZED;

  const isInitialized: Client['isInitialized'] = () =>
    status === ClientStatus.AUTHORIZED || status === ClientStatus.UNAUTHORIZED;

  const setError: Client['setError'] = newError => {
    const oldType = error && error.type;
    const newType = newError && newError.type;
    if (oldType === newType) {
      return false;
    }
    error = newError;
    eventTrigger(ClientEvent.ERROR, error);
    return true;
  };

  const setStatus: Client['setStatus'] = newStatus => {
    if (newStatus === status) {
      return false;
    }
    status = newStatus;
    eventTrigger(ClientEvent.STATUS_CHANGE, status);
    return true;
  };

  const getApiToken: ClientFactory['getApiToken'] = audience =>
    tokenStorage[audience];

  const addApiTokens: ClientFactory['addApiTokens'] = newToken => {
    Object.assign(tokenStorage, newToken);
    return tokenStorage;
  };

  const removeApiToken: ClientFactory['removeApiToken'] = audience => {
    delete tokenStorage[audience];
    return tokenStorage;
  };

  const saveReturnedApiTokens = (
    tokenData: JWTPayload,
    audience: string
  ): JWTPayload => {
    const isSingleTokenResponse = !!tokenData['access_token'];
    const storageValue = isSingleTokenResponse
      ? tokenData['access_token']
      : tokenData[audience];

    const storageData = { [audience]: storageValue } as JWTPayload;
    addApiTokens(storageData);
    if (!isSingleTokenResponse) {
      Object.keys(tokenData).forEach(currentKey => {
        if (currentKey === audience) {
          return;
        }
        const token = tokenData[currentKey];
        if (token) {
          addApiTokens({ [currentKey]: token });
        }
      });
    }
    return storageData;
  };

  const fetchApiToken: ClientFactory['fetchApiToken'] = async options => {
    const currentToken = getApiToken(options.audience);
    if (currentToken) {
      return Promise.resolve({ [options.audience]: currentToken });
    }
    const myHeaders = new Headers();
    myHeaders.append('Authorization', `Bearer ${options.accessToken}`);
    myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');

    const urlencoded = new URLSearchParams();
    urlencoded.append('audience', options.audience);
    if (config.apiGrantType) {
      urlencoded.append('grant_type', config.apiGrantType);
    }
    if (config.apiPermission) {
      urlencoded.append('permission', config.apiPermission);
    }

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: urlencoded
    };

    const [fetchError, fetchResponse]: [
      Error | null,
      Response | undefined
    ] = await to(fetch(options.uri, requestOptions));
    if (fetchError || !fetchResponse) {
      return {
        error: fetchError,
        message: 'Network or CORS error occured'
      } as FetchError;
    }
    if (!fetchResponse.ok) {
      return {
        status: fetchResponse.status,
        message: fetchResponse.statusText,
        error: new Error(await fetchResponse.text())
      } as FetchError;
    }
    const [parseError, json] = await to(fetchResponse.json());
    if (parseError) {
      return {
        error: parseError,
        message: 'Returned data is not valid json'
      } as FetchError;
    }
    return saveReturnedApiTokens(json, options.audience);
  };

  return {
    addListener,
    eventTrigger,
    getStatus,
    getError,
    getStoredUser,
    setStoredUser,
    setStatus,
    setError,
    isInitialized,
    isAuthenticated,
    fetchApiToken,
    getApiToken,
    addApiTokens,
    removeApiToken
  };
}

let config: ClientConfig;

export function setClientConfig(newConfig: ClientConfig): ClientConfig {
  config = newConfig;
  return config;
}

export function getClientConfig(): ClientConfig {
  return config;
}

export function hasValidClientConfig(): boolean {
  return !!(config && config.url && config.clientId);
}

export function getLocationBasedUri(
  property: string | undefined
): string | undefined {
  const location = window.location.origin;
  if (property === undefined) {
    return undefined;
  }
  return `${location}${property}`;
}

export function getTokenUri(clientConfig: ClientConfig): string {
  if (clientConfig.tokenExchangePath) {
    return `${clientConfig.url}${clientConfig.tokenExchangePath}`;
  }
  return `${clientConfig.url}/realms/${clientConfig.realm}/protocol/openid-connect/token`;
}

export function createClientGetOrLoadUserFunction({
  getUser,
  isInitialized,
  init
}: Pick<Client, 'getUser' | 'isInitialized' | 'init'>): () => Promise<
  User | undefined | null
> {
  return () => {
    const currentUser = getUser();
    if (currentUser) {
      return Promise.resolve(currentUser);
    }
    if (isInitialized()) {
      return Promise.resolve(undefined);
    }
    return new Promise((resolve, reject) => {
      init()
        .then(() => resolve(getUser()))
        .catch(e => reject(e));
    });
  };
}
