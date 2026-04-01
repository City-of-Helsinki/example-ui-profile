import {
  UserManager,
  UserManagerSettings,
  User,
  UserManagerEvents
} from 'oidc-client-ts';
import { mockMutatorCreator, MockMutator } from './index';
import { AnyFunction } from '../../common';

let oidcReactMutator: MockMutator;

// imports in setUpTests.ts require "mock" prefix, therefore getMockMutator would be invalid
export const mockMutatorGetterOidc = (): MockMutator => {
  if (!oidcReactMutator) {
    oidcReactMutator = mockMutatorCreator();
  }
  return oidcReactMutator;
};

type AnyCallback = (payload?: User & Error) => void;

const mockUserManagerEvents = (): UserManagerEvents => {
  const listeners: Map<string, AnyCallback[]> = new Map();
  const addListener = (type: string, callback: AnyCallback): void => {
    if (!listeners.has(type)) {
      listeners.set(type, []);
    }
    const list = listeners.get(type);
    if (list) {
      list.push(callback);
    }
  };
  const trigger = (type: string, payload: User & Error): void => {
    if (!listeners.has(type)) {
      return;
    }
    const list = listeners.get(type);
    if (list) {
      list.forEach(callback => callback(payload));
    }
  };
  const noop = (): void => undefined;
  return ({
    load: (): Promise<void> => Promise.resolve(),
    unload: (): Promise<void> => Promise.resolve(),
    addUserUnloaded: (callback: AnyCallback): (() => void) => {
      addListener('userUnloaded', callback);
      return noop;
    },
    addUserSignedOut: (callback: AnyCallback): (() => void) => {
      addListener('userSignedOut', callback);
      return noop;
    },
    addUserSessionChanged: (callback: AnyCallback): (() => void) => {
      addListener('userSessionChanged', callback);
      return noop;
    },
    addSilentRenewError: (callback: AnyCallback): (() => void) => {
      addListener('silentRenewError', callback);
      return noop;
    },
    addAccessTokenExpired: (callback: AnyCallback): (() => void) => {
      addListener('accessTokenExpired', callback);
      return noop;
    },
    addUserLoaded: (callback: AnyCallback): (() => void) => {
      addListener('userLoaded', callback);
      return noop;
    },
    addAccessTokenExpiring: (callback: AnyCallback): (() => void) => {
      addListener('accessTokenExpiring', callback);
      return noop;
    },
    removeUserLoaded: noop,
    removeUserUnloaded: noop,
    removeSilentRenewError: noop,
    removeUserSignedOut: noop,
    removeAccessTokenExpired: noop,
    removeAccessTokenExpiring: noop,
    removeUserSessionChanged: noop,
    addUserSignedIn: (): (() => void) => noop,
    removeUserSignedIn: noop,
    trigger
  } as unknown) as UserManagerEvents;
};

export const mockOidcUserManager = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  settings: UserManagerSettings
): Partial<UserManager> => {
  const mockMutator = mockMutatorGetterOidc();
  mockMutator.clientCreated();
  const initPromiseF = (): Promise<User> => {
    mockMutator.initCalled();
    const clientInitRejectPayload = mockMutator.getClientInitRejectPayload();
    return new Promise(
      (
        resolve: (props?: unknown) => unknown,
        reject: (props?: unknown) => unknown
      ) => {
        setTimeout((): void => {
          const tokenParsed = mockMutator.getTokenParsed();
          const sessionState = tokenParsed.session_state;
          const user = sessionState
            ? {
                profile: mockMutator.getTokenParsed(),
                session_state: sessionState,
                expired: false
              }
            : undefined;
          // eslint-disable-next-line no-unused-expressions
          clientInitRejectPayload
            ? reject(clientInitRejectPayload)
            : resolve(user);
        }, mockMutator.promiseTimeout);
      }
    ) as Promise<User>;
  };
  return {
    signinSilent(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      initOptions?: UserManagerSettings
    ): Promise<User> {
      return initPromiseF();
    },
    signinRedirect: (args?: unknown): Promise<void> => {
      mockMutator.loginCalled(args);
      return Promise.resolve();
    },
    signoutRedirect: (args?: unknown): Promise<void> => {
      mockMutator.logoutCalled(args);
      mockMutator.setUser();
      return Promise.resolve();
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    signinRedirectCallback: (url?: string): Promise<User> => initPromiseF(),
    getUser: (): Promise<User> => {
      const loadProfileRejectPayload = mockMutator.getLoadProfileRejectPayload();
      const loadProfileResolvePayload = mockMutator.getLoadProfileResolvePayload();
      return new Promise((resolve: AnyFunction, reject: AnyFunction) => {
        setTimeout((): void => {
          // eslint-disable-next-line no-unused-expressions
          loadProfileRejectPayload
            ? reject(loadProfileRejectPayload)
            : resolve({ ...loadProfileResolvePayload, expired: false });
        }, mockMutator.promiseTimeout);
      }) as Promise<User>;
    },
    events: mockUserManagerEvents()
  };
};
