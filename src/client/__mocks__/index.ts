/* eslint-disable camelcase */
import { ReactWrapper } from 'enzyme';
import { UserManager } from 'oidc-client';
import {
  Client,
  ClientEvent,
  ClientEventId,
  ClientConfig,
  setClientConfig,
  Token
} from '..';
import config from '../../config';
import {
  AnyObject,
  AnyFunction,
  AnyNonNullishValue,
  AnyValue
} from '../../common';
import { getSessionStorageKey } from '../oidc-react';

type ClientInstance = UserManager;

export type MockMutator = {
  setClientInitPayload: (resolve: AnyValue, reject: AnyValue) => void;
  getClientInitResolvePayload: () => Payload;
  getClientInitRejectPayload: () => Payload;
  getLoadProfileResolvePayload: () => Payload;
  getLoadProfileRejectPayload: () => Payload;
  getTokenParsed: () => AnyObject;
  setTokenParsed: (props: AnyNonNullishValue) => void;
  setUser: (props?: AnyNonNullishValue) => void;
  getUser: () => AnyNonNullishValue | undefined;
  getTokens: () => Tokens;
  getInitCallCount: () => number;
  initCalled: () => void;
  getCreationCount: () => number;
  clientCreated: () => void;
  loginCalled: (props?: unknown) => void;
  logoutCalled: (props?: unknown) => void;
  resetMock: () => void;
  setLoadProfilePayload: (resolve: AnyValue, reject: AnyValue) => void;
  getLoginCallCount: () => number;
  getLogoutCallCount: () => number;
  setTokens: (newTokens: AnyNonNullishValue) => AnyNonNullishValue;
  getInstance: () => ClientInstance;
  setInstance: (instance: ClientInstance) => void;
  createValidUserData: (
    props?: AnyNonNullishValue
  ) => {
    email: string;
    name: string;
    given_name: string;
    family_name: string;
  };
  promiseTimeout: number;
};

export type InstanceIdentifier = {
  callback: AnyFunction;
  client?: Client;
  id: string;
};

export type ClientValues = {
  status: string;
  authenticated: boolean;
  initialized: boolean;
  error: string | undefined;
  email: string | undefined;
};

export type EventListeners = Record<ClientEventId, jest.Mock> & {
  dispose: () => void;
  getLastCallPayload: (eventType: ClientEventId) => Payload;
  getCallCount: (eventType: ClientEventId) => number;
};

export type ListenerSetter = (
  eventType: string,
  listener: AnyFunction
) => AnyFunction;

type Payload = AnyValue;
type Tokens = {
  token: Token;
  idToken: Token;
  refreshToken: Token;
};

export const promiseDefaultTimeout = 20;
// default interval of "waitFor" is 50ms. That + 20ms should be enough
// provide a detectable gap between "loading" and "loaded" state changes
export const requestDelayForStatusChangeDetectionInMs = 70;

export const getClientDataFromComponent = (
  dom: ReactWrapper,
  selector: string
): ClientValues | undefined => {
  const component = dom.find(selector).at(0);
  if (!component) {
    return;
  }
  const status = component.find('.status').text();
  const authenticated = component.find('.authenticated').text() === 'true';
  const initialized = component.find('.initialized').text() === 'true';
  const error = component.find('.error').text() || undefined;
  const email = component.find('.email').text() || undefined;
  // eslint-disable-next-line consistent-return
  return {
    status,
    authenticated,
    initialized,
    error,
    email
  };
};

export const matchClientDataWithComponent = (
  dom: ReactWrapper,
  selector: string,
  client: Client
): ClientValues | undefined => {
  const values = getClientDataFromComponent(dom, selector);
  expect(values).toBeDefined();
  const user = client.getUser();
  if (values) {
    expect(values.status).toBe(client.getStatus());
    expect(values.authenticated).toBe(client.isAuthenticated());
    expect(values.initialized).toBe(client.isInitialized());
    expect(values.email).toBe(user ? user.email : undefined);
  }
  return values;
};

export const configureClient = (
  overrides?: Partial<ClientConfig>
): ClientConfig =>
  setClientConfig({ ...config.tunnistamoConfig, ...overrides });

export const createEventListeners = (
  addEventListener: ListenerSetter
): EventListeners => {
  const listeners: Partial<EventListeners> = {};
  const disposers: AnyFunction[] = [];
  Object.keys(ClientEvent).forEach((eventType: string): void => {
    const listener = jest.fn();
    listeners[eventType as ClientEventId] = listener;
    disposers.push(addEventListener(eventType, listener));
  });
  const getLastCallPayload = (eventType: ClientEventId): Payload => {
    const listenerMock = listeners[eventType];
    if (!listenerMock || !listenerMock.mock) {
      return undefined;
    }
    const calls = listenerMock.mock.calls[0];
    return calls[calls.length - 1];
  };
  const getCallCount = (eventType: ClientEventId): number => {
    const listenerMock = listeners[eventType];
    if (!listenerMock || !listenerMock.mock) {
      return -1;
    }
    const { calls } = listenerMock.mock;
    return calls ? calls.length : 0;
  };
  return {
    ...(listeners as EventListeners),
    dispose: (): void => {
      disposers.forEach(disposer => disposer());
    },
    getLastCallPayload,
    getCallCount
  };
};

// imports in setUpTests.ts require "mock" prefix, therefore createMockMutator would be invalid
export const mockMutatorCreator = (): MockMutator => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  let clientInitResolvePayload: Payload;
  let clientInitRejectPayload: Payload;
  let loadProfileResolvePayload: Payload;
  let loadProfileRejectPayload: Payload;
  let user: AnyObject = {};
  let tokenParsed: AnyObject = {};
  let initCallCount = 0;
  let creationCount = 0;
  let loginMock: jest.Mock;
  let logoutMock: jest.Mock;
  const tokens = {
    token: undefined,
    idToken: undefined,
    refreshToken: undefined
  };
  let clientInstance: ClientInstance;
  /* eslint-enable @typescript-eslint/no-unused-vars */

  const setClientInitPayload: MockMutator['setClientInitPayload'] = (
    resolvePayload,
    rejectPayload
  ): void => {
    clientInitResolvePayload = resolvePayload;
    clientInitRejectPayload = rejectPayload;
  };
  const setLoadProfilePayload: MockMutator['setLoadProfilePayload'] = (
    resolvePayload,
    rejectPayload
  ): void => {
    loadProfileResolvePayload = resolvePayload;
    loadProfileRejectPayload = rejectPayload;
  };

  const getClientInitResolvePayload: MockMutator['getClientInitResolvePayload'] = () =>
    clientInitResolvePayload;
  const getClientInitRejectPayload: MockMutator['getClientInitRejectPayload'] = () =>
    clientInitRejectPayload;
  const getLoadProfileResolvePayload: MockMutator['getLoadProfileResolvePayload'] = () =>
    loadProfileResolvePayload;
  const getLoadProfileRejectPayload: MockMutator['getLoadProfileRejectPayload'] = () =>
    loadProfileRejectPayload;

  const setUserToSessionStorage = (data: AnyObject | string) => {
    const key = getSessionStorageKey(config.tunnistamoConfig);
    sessionStorage.setItem(
      key,
      typeof data === 'object' ? JSON.stringify(data) : data
    );
  };

  const setTokenParsed: MockMutator['setTokenParsed'] = (
    props: AnyObject
  ): void => {
    tokenParsed = Object.assign(tokenParsed, {
      ...user,
      ...props
    });
    setUserToSessionStorage({ profile: tokenParsed });
  };
  const getTokenParsed: MockMutator['getTokenParsed'] = (): Record<
    string,
    unknown
  > => tokenParsed;
  const createEmptyUser = (): AnyObject => ({
    name: undefined,
    given_name: undefined,
    family_name: undefined,
    email: undefined
  });

  const setUser: MockMutator['setUser'] = props => {
    user = props || createEmptyUser();
    setTokenParsed(user);
  };
  const getUser: MockMutator['getUser'] = () => user;
  const getInitCallCount: MockMutator['getInitCallCount'] = () => initCallCount;
  const initCalled: MockMutator['initCalled'] = () => {
    initCallCount += 1;
  };
  const getCreationCount: MockMutator['getCreationCount'] = () => creationCount;
  const clientCreated: MockMutator['clientCreated'] = () => {
    creationCount += 1;
  };
  const getLoginCallCount: MockMutator['getLoginCallCount'] = () =>
    loginMock ? loginMock.mock.calls.length : -1;
  const loginCalled: MockMutator['loginCalled'] = () => {
    loginMock();
  };
  const getLogoutCallCount: MockMutator['getLogoutCallCount'] = () =>
    logoutMock ? logoutMock.mock.calls.length : -1;
  const logoutCalled: MockMutator['logoutCalled'] = () => {
    logoutMock();
  };
  const setTokens: MockMutator['setTokens'] = newTokens => {
    Object.assign(tokens, newTokens);
    return tokens;
  };
  const getTokens: MockMutator['getTokens'] = () => tokens;
  const getInstance: MockMutator['getInstance'] = () => clientInstance;
  const setInstance: MockMutator['setInstance'] = instance => {
    clientInstance = instance;
  };
  const createValidUserData: MockMutator['createValidUserData'] = props => ({
    name: 'valid user',
    given_name: 'valid',
    family_name: 'user',
    email: 'valid@user.fi',
    ...props
  });
  const resetMock: MockMutator['resetMock'] = () => {
    creationCount = 0;
    initCallCount = 0;
    clientInitResolvePayload = true;
    clientInitRejectPayload = undefined;
    loadProfileResolvePayload = { given_name: 'given_name' };
    loadProfileRejectPayload = undefined;
    loginMock = jest.fn();
    logoutMock = jest.fn();
    user = {};
    Object.keys(tokenParsed).forEach((key: string) => {
      tokenParsed[key] = undefined;
    });
    setTokens({
      token: undefined,
      idToken: undefined,
      refreshToken: undefined
    });
    tokenParsed.session_state = `session_state-${Date.now()}`;
    tokenParsed.amr = 'test';
  };
  return {
    promiseTimeout: promiseDefaultTimeout,
    setClientInitPayload,
    getTokenParsed,
    setTokenParsed,
    setUser,
    getUser,
    getInitCallCount,
    getCreationCount,
    resetMock,
    setLoadProfilePayload,
    getLoginCallCount,
    getLogoutCallCount,
    setTokens,
    getTokens,
    getInstance,
    setInstance,
    createValidUserData,
    initCalled,
    clientCreated,
    getClientInitResolvePayload,
    getClientInitRejectPayload,
    getLoadProfileResolvePayload,
    getLoadProfileRejectPayload,
    logoutCalled,
    loginCalled
  };
};
