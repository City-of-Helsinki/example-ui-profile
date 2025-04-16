import { FetchMock } from 'jest-fetch-mock';
import {
  Client,
  FetchApiTokenOptions,
  JWTPayload,
  getClientConfig,
  getTokenUri
} from '../client';
import {
  MockMutator,
  requestDelayForStatusChangeDetectionInMs
} from '../client/__mocks__/index';
import { AnyFunction, AnyObject } from '../common';

type NodeJS = AnyObject;

export const mockApiTokenResponse = (
  options: {
    audience?: string;
    uri?: string;
    delay?: number;
    requestCallback?: AnyFunction;
    returnError?: boolean;
    additionalTokenAudience?: string;
  } = {}
): AnyObject => {
  const {
    audience,
    uri,
    delay,
    requestCallback,
    returnError,
    additionalTokenAudience
  } = options;
  const fetchMock = (global.fetch as unknown) as FetchMock;
  const tokenKey =
    audience ||
    window._env_.REACT_APP_KEYCLOAK_PROFILE_API_TOKEN_AUDIENCE ||
    'unknown';
  const tokens: JWTPayload = { [tokenKey]: 'apiToken' };
  if (additionalTokenAudience) {
    tokens[additionalTokenAudience] = 'additionalToken';
  }
  const responseData = returnError
    ? { status: 401, body: JSON.stringify({ error: true }) }
    : {
        status: 200,
        body: JSON.stringify(tokens)
      };
  const endPointUri =
    uri ||
    getTokenUri({
      ...getClientConfig()
    });
  fetchMock.doMockOnceIf(endPointUri, req => {
    if (requestCallback) {
      requestCallback(req);
    }
    return new Promise(resolve =>
      setTimeout(() => {
        resolve(responseData);
      }, delay || requestDelayForStatusChangeDetectionInMs)
    );
  });
  return tokens;
};

export const clearApiTokens = (client: Client): void => {
  const config = getClientConfig();
  client.removeApiToken(config.exampleApiTokenAudience);
  client.removeApiToken(config.profileApiTokenAudience);
};

export const logoutUser = (client: Client): void => {
  if (client.isAuthenticated()) {
    client.onAuthChange(false);
  }
};

export const setUpUser = async (
  user: AnyObject,
  mockMutator: MockMutator,
  client: Client
): Promise<void> => {
  mockMutator.setLoadProfilePayload(
    mockMutator.createValidUserData(user),
    undefined
  );
  await client.loadUserProfile();
  client.onAuthChange(true);
};

export const createApiTokenFetchPayload = (
  overrides?: Partial<FetchApiTokenOptions>
): FetchApiTokenOptions => ({
  audience: 'audience',
  ...overrides
});

export const setEnv = (overrides: Partial<NodeJS.ProcessEnv>): (() => void) => {
  const source = window._env_;
  const oldValues = Object.keys(overrides).reduce((currentObj, currentKey) => {
    // eslint-disable-next-line no-param-reassign
    currentObj[currentKey] = source[currentKey];
    return currentObj;
  }, {} as AnyObject);
  window._env_ = {
    ...window._env_,
    ...overrides
  };
  return () => {
    window._env_ = {
      ...window._env_,
      ...oldValues
    };
  };
};
