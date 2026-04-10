// following ts-ignore + eslint-disable fixes "Could not find declaration file for module" error for await-handler
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import to from 'await-to-js';
import {
  configureClient,
  EventListeners,
  createEventListeners,
  ListenerSetter,
} from '../__mocks__';
import {
  ClientStatus,
  Client,
  ClientEvent,
  ClientErrorObject,
  ClientError,
} from '../index';
import { createOidcClient } from '../oidc-react';
import { mockMutatorGetterOidc } from '../__mocks__/oidc-react-mock';
import { AnyObject } from '../../common';

describe(`Client`, () => {
  let client: Client;
  configureClient({ autoSignIn: true });
  const mockMutator = mockMutatorGetterOidc();
  let eventListeners: EventListeners;
  function createNewClient(): Client {
    client = createOidcClient();
    return client;
  }

  describe('calling init()', () => {
    beforeEach(() => {
      mockMutator.resetMock();
      client = createNewClient();
      eventListeners = createEventListeners(
        client.addListener as unknown as ListenerSetter,
      );
    });
    afterEach(() => {
      eventListeners.dispose();
    });
    it('returns same initPromise and init is called only once. Status changes to AUTHORIZED', async () => {
      expect(client.getStatus()).toBe(ClientStatus.NONE);
      const promise1 = client.init();
      expect(client.getStatus()).toBe(ClientStatus.INITIALIZING);
      expect(eventListeners.getCallCount(ClientEvent.STATUS_CHANGE)).toBe(1);
      const promise2 = client.init();
      // third call for testing only
      await client.init();
      await to(promise1);
      await to(promise2);
      expect(promise1 === promise2).toBe(true);
      expect(mockMutator.getInitCallCount()).toBe(1);
      expect(mockMutator.getCreationCount()).toBe(1);
      expect(client.getStatus()).toBe(ClientStatus.AUTHORIZED);
      expect(eventListeners.getCallCount(ClientEvent.STATUS_CHANGE)).toBe(2);
      expect(eventListeners.getCallCount(ClientEvent.AUTHORIZED)).toBe(1);
      expect(eventListeners.getCallCount(ClientEvent.UNAUTHORIZED)).toBe(0);
    });
    it('failure results in UNAUTHORIZED status', async () => {
      expect(client.getStatus()).toBe(ClientStatus.NONE);
      mockMutator.setClientInitPayload(undefined, { error: 1 });
      await to(client.init());
      expect(client.getStatus()).toBe(ClientStatus.UNAUTHORIZED);

      expect(eventListeners.getCallCount(ClientEvent.ERROR)).toBe(1);
      const error: ClientErrorObject = eventListeners.getLastCallPayload(
        ClientEvent.ERROR,
      ) as ClientErrorObject;
      expect(error).toBeDefined();
      if (error) {
        expect(error.type).toBe(ClientError.AUTH_ERROR);
      }
    });
    it('success results in AUTHORIZED status', async () => {
      expect(client.getStatus()).toBe(ClientStatus.NONE);
      await to(client.init());
      expect(client.getStatus()).toBe(ClientStatus.AUTHORIZED);
    });
  });
  describe('calling onAuthChange()', () => {
    beforeEach(() => {
      mockMutator.resetMock();
      client = createNewClient();
      eventListeners = createEventListeners(
        client.addListener as unknown as ListenerSetter,
      );
    });
    afterEach(() => {
      eventListeners.dispose();
    });
    it('changes status and triggers events when changed statusChange', async () => {
      const email = 'authorized@bar.com';
      // 2 = INITIALIZED + AUTHORIZED
      const statusChangeCountAfterAuthorized = 2;
      // 3 = previous + UNAUTHORIZED
      const statusChangeCountAfterUnAuthorized = 3;
      mockMutator.setUser(mockMutator.createValidUserData({ email }));
      await to(client.init());
      expect(client.getStatus()).toBe(ClientStatus.AUTHORIZED);
      expect(eventListeners.getCallCount(ClientEvent.STATUS_CHANGE)).toBe(
        statusChangeCountAfterAuthorized,
      );
      expect(eventListeners.getCallCount(ClientEvent.AUTHORIZED)).toBe(1);
      expect(eventListeners.getCallCount(ClientEvent.UNAUTHORIZED)).toBe(0);
      expect(client.onAuthChange(false)).toBe(true);
      expect(client.getStatus()).toBe(ClientStatus.UNAUTHORIZED);
      expect(eventListeners.getCallCount(ClientEvent.AUTHORIZED)).toBe(1);
      expect(eventListeners.getCallCount(ClientEvent.UNAUTHORIZED)).toBe(1);
      expect(eventListeners.getCallCount(ClientEvent.STATUS_CHANGE)).toBe(
        statusChangeCountAfterUnAuthorized,
      );
      // user data is event payload in ClientEvent.AUTHORIZED
      const userData = eventListeners.getLastCallPayload(
        ClientEvent.AUTHORIZED,
      );
      expect(userData && (userData as AnyObject).email).toBe(email);
    });
    it('trying to set authentication status same as it is, does nothing', async () => {
      mockMutator.setClientInitPayload(undefined, { error: 1 });
      await to(client.init());
      expect(client.getStatus()).toBe(ClientStatus.UNAUTHORIZED);
      expect(client.onAuthChange(false)).toBe(false);
      expect(client.getStatus()).toBe(ClientStatus.UNAUTHORIZED);
      expect(eventListeners.getCallCount(ClientEvent.AUTHORIZED)).toBe(0);
      expect(eventListeners.getCallCount(ClientEvent.UNAUTHORIZED)).toBe(1);
      expect(eventListeners.getCallCount(ClientEvent.STATUS_CHANGE)).toBe(2);
    });
  });
  describe('calling getUser()', () => {
    beforeEach(() => {
      mockMutator.resetMock();
      client = createNewClient();
    });
    it('returns user data if authenticated and data is found. Otherwise returns undefined', async () => {
      const email = 'foo@bar.com';
      mockMutator.setUser(mockMutator.createValidUserData({ email }));
      await to(client.init());
      client.onAuthChange(true);
      const user = client.getUser();
      expect(user && user.email).toBe(email);
      expect(client.onAuthChange(false)).toBe(true);
      expect(client.getUser()).toBe(undefined);
    });
  });
  describe('calling login/logout', () => {
    beforeEach(() => {
      client = createNewClient();
      eventListeners = createEventListeners(
        client.addListener as unknown as ListenerSetter,
      );
    });
    afterEach(() => {
      eventListeners.dispose();
    });
    const tokens = {
      token: 'token',
      idToken: 'idToken',
      refreshToken: 'refreshToken',
    };
    it('login call is passed to the client library and tokens are saved', async () => {
      mockMutator.setTokens(tokens);
      await to(client.init());
      client.login();
      expect(mockMutator.getLoginCallCount()).toBe(1);
    });
    it('logout call is passed to the client library and event is triggered and tokens are cleared', async () => {
      mockMutator.setTokens(tokens);
      await to(client.init());
      client.logout();
      expect(mockMutator.getLogoutCallCount()).toBe(1);
      expect(eventListeners.getCallCount(ClientEvent.LOGGING_OUT)).toBe(1);
      mockMutator.setUser({});
      expect(client.getUser()).toBe(undefined);
    });
  });
  describe('calling loadUserProfile()', () => {
    beforeEach(() => {
      mockMutator.resetMock();
      client = createNewClient();
      eventListeners = createEventListeners(
        client.addListener as unknown as ListenerSetter,
      );
    });
    afterEach(() => {
      eventListeners.dispose();
    });
    it('loads and stores user data when successful', async () => {
      const email = 'foo@another.bar.com';
      mockMutator.setLoadProfilePayload(
        mockMutator.createValidUserData({ email }),
        undefined,
      );
      const [error, user] = await to(client.loadUserProfile());
      expect(error).toBe(null);
      expect(user && (user as AnyObject).email).toBe(email);
      const userProfile = client.getUserProfile();
      expect(userProfile).toEqual(user);
      expect(client.getUser()).toBe(undefined);
    });
    it('clears user data when failed and creates error', async () => {
      const profileError = new Error('profile load failed');
      mockMutator.setLoadProfilePayload(undefined, profileError);
      const [error, user] = await to(client.loadUserProfile());
      expect(error).toEqual(profileError);
      expect(user).toEqual(undefined);
      const userProfile = client.getUserProfile();
      expect(userProfile).toEqual(undefined);
      const clientError = client.getError();
      expect(clientError?.type).toEqual(ClientError.LOAD_ERROR);
      expect(clientError?.message.includes(profileError.message)).toBe(true);
      expect(eventListeners.getCallCount(ClientEvent.ERROR)).toBe(1);
    });
  });
  describe('calling getOrLoadUser()', () => {
    beforeEach(() => {
      mockMutator.resetMock();
      client = createNewClient();
      eventListeners = createEventListeners(
        client.addListener as unknown as ListenerSetter,
      );
    });
    afterEach(() => {
      eventListeners.dispose();
    });
    it('calls init() if not initialized and returns user data. Init is not called again', async () => {
      const email = 'foo@foofoo.bar.com';
      mockMutator.setUser(mockMutator.createValidUserData({ email }));
      const [error, user] = await to(client.getOrLoadUser());
      expect(error).toBe(null);
      expect(mockMutator.getInitCallCount()).toBe(1);
      expect(client.getStatus()).toBe(ClientStatus.AUTHORIZED);
      expect(user && (user as AnyObject).email).toBe(email);

      const [, user2] = await to(client.getOrLoadUser());
      expect(mockMutator.getInitCallCount()).toBe(1);
      expect(user2 && (user2 as AnyObject).email).toBe(email);
    });
    it('calls init() if not initialized and returns undefined if not authorized. Init is not called again', async () => {
      const initError = { error: true };
      mockMutator.setClientInitPayload(undefined, initError);
      const [error, user] = await to(client.getOrLoadUser());
      expect(user).toBe(undefined);
      expect(error).toEqual(initError);
      expect(mockMutator.getInitCallCount()).toBe(1);
      expect(client.getStatus()).toBe(ClientStatus.UNAUTHORIZED);

      const [, user2] = await to(client.getOrLoadUser());
      expect(mockMutator.getInitCallCount()).toBe(1);
      expect(user2).toBe(undefined);
    });
  });
});
