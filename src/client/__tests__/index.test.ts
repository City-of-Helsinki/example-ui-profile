import { FetchMock } from 'jest-fetch-mock';

import {
  ClientErrorObject,
  ClientEvent,
  ClientEventId,
  ClientFactory,
  ClientStatus,
  createClient,
  EventPayload,
  FetchApiTokenConfiguration,
  getTokenUri,
  getClientConfig,
  FetchError,
  JWTPayload
} from '../index';
import { configureClient } from '../__mocks__';
import { AnyFunction, AnyObject } from '../../common';

describe('Client factory ', () => {
  let client: ClientFactory;
  const fetchMock: FetchMock = global.fetch;
  const config = configureClient();
  beforeEach(() => {
    client = createClient();
  });
  describe('getters and setters work properly and ', () => {
    it('getStatus returns current status. setStatus changes status and returns boolean indicating did status change', () => {
      expect(client.getStatus()).toBe(ClientStatus.NONE);
      expect(client.setStatus(ClientStatus.NONE)).toBe(false);
      expect(client.setStatus(ClientStatus.INITIALIZING)).toBe(true);
      expect(client.setStatus(ClientStatus.INITIALIZING)).toBe(false);
      expect(client.getStatus()).toBe(ClientStatus.INITIALIZING);
      expect(client.setStatus(ClientStatus.AUTHORIZED)).toBe(true);
    });
    it('getError returns current error. setError changes error and returns boolean indicating did error type change', () => {
      const firstError: ClientErrorObject = { type: 'foo1', message: 'bar1' };
      const secondError: ClientErrorObject = { type: 'foo2', message: 'bar2' };
      const thirdError: ClientErrorObject = { type: 'foo3', message: 'bar3' };
      expect(client.getError()).toBe(undefined);
      expect(client.setError(firstError)).toBe(true);
      expect(client.setError(secondError)).toBe(true);
      expect(client.setError(secondError)).toBe(false);
      expect(client.getError()).toBe(secondError);
      expect(client.setError(thirdError)).toBe(true);
      expect(client.getError()).toBe(thirdError);
    });
    it('getStoredUser returns current user data. setStoredUser changes user data', () => {
      const user = { name: 'user' };
      expect(client.getStoredUser()).toBe(undefined);
      client.setStoredUser(user);
      const storedUser = client.getStoredUser() || {};
      expect(storedUser.name).toMatch(user.name);
    });
    it('getApiToken returns stored apiTokens. addApiTokens adds and removeApiToken removes', () => {
      expect(client.getApiToken('token1')).toBeUndefined();
      const token1And2 = { token1: 'token1', token2: 'token2' };
      client.addApiTokens(token1And2);
      const token3 = { token3: 'token3' };
      client.addApiTokens(token3);
      expect(client.getApiToken('token1')).toBe(token1And2.token1);
      expect(client.getApiToken('token2')).toBe(token1And2.token2);
      expect(client.getApiToken('token3')).toBe(token3.token3);
      client.removeApiToken('token2');
      expect(client.getApiToken('token2')).toBeUndefined();
      expect(client.getApiToken('token1')).toBe(token1And2.token1);
    });
  });
  describe('isInitialized and isAuthenticated reflect status changes ', () => {
    it('isInitialized', () => {
      expect(client.getStatus()).toEqual(ClientStatus.NONE);
      expect(client.isInitialized()).toBe(false);
      client.setStatus(ClientStatus.INITIALIZING);
      expect(client.isInitialized()).toBe(false);
      client.setStatus(ClientStatus.UNAUTHORIZED);
      expect(client.isInitialized()).toBe(true);
      client.setStatus(ClientStatus.AUTHORIZED);
      expect(client.isInitialized()).toBe(true);
    });
    it('isAuthenticated', () => {
      expect(client.getStatus()).toEqual(ClientStatus.NONE);
      expect(client.isAuthenticated()).toBe(false);
      client.setStatus(ClientStatus.INITIALIZING);
      expect(client.isAuthenticated()).toBe(false);
      client.setStatus(ClientStatus.UNAUTHORIZED);
      expect(client.isAuthenticated()).toBe(false);
      client.setStatus(ClientStatus.AUTHORIZED);
      expect(client.isAuthenticated()).toBe(true);
    });
  });
  describe('event handling can ', () => {
    type MockFunctions = {
      getLastCallPayload: AnyFunction;
      getCallCount: AnyFunction;
      disposer: AnyFunction;
    };

    function addListenerMock(eventType: ClientEventId): MockFunctions {
      const listenerMock = jest.fn();
      const listenerFunc = (payload?: EventPayload): void => {
        listenerMock(payload);
      };
      const disposer = client.addListener(eventType, listenerFunc);
      const getLastCallPayload = (): AnyObject => {
        const { calls } = listenerMock.mock;
        const payloads = calls[calls.length - 1];
        return payloads ? payloads[0] : undefined;
      };
      const getCallCount = (): number => {
        const { calls } = listenerMock.mock;
        return calls ? calls.length : 0;
      };
      return { disposer, getLastCallPayload, getCallCount };
    }

    function createMocks(): MockFunctions[] {
      return [
        addListenerMock(ClientEvent.STATUS_CHANGE),
        addListenerMock(ClientEvent.UNAUTHORIZED),
        addListenerMock(ClientEvent.ERROR)
      ];
    }

    it('addListener and trigger event', () => {
      const [mock1Funcs, mock2Funcs] = createMocks();
      const {
        getLastCallPayload: getListener1LastCallPayload,
        getCallCount: getCall1Count
      } = mock1Funcs;
      const {
        getLastCallPayload: getListener2LastCallPayload,
        getCallCount: getCall2Count
      } = mock2Funcs;
      const call1Payload = { callNum: 1 };
      client.eventTrigger(ClientEvent.STATUS_CHANGE, call1Payload);
      expect(getListener1LastCallPayload()).toBe(call1Payload);
      expect(getCall1Count()).toBe(1);

      const call2Payload = { callNum: 2 };
      client.eventTrigger(ClientEvent.UNAUTHORIZED, call2Payload);
      expect(getCall1Count()).toBe(1);
      expect(getCall2Count()).toBe(1);
      expect(getListener2LastCallPayload()).toBe(call2Payload);

      client.eventTrigger(ClientEvent.STATUS_CHANGE, call1Payload);
      expect(getCall1Count()).toBe(2);
      expect(getCall2Count()).toBe(1);
    });

    it('call listener disposers and check listeners are not triggered anymore', () => {
      const [mock1Funcs, mock2Funcs] = createMocks();
      const { disposer: disposer1, getCallCount: getCall1Count } = mock1Funcs;
      const { disposer: disposer2, getCallCount: getCall2Count } = mock2Funcs;
      expect(getCall1Count()).toBe(0);
      expect(getCall2Count()).toBe(0);
      client.eventTrigger(ClientEvent.STATUS_CHANGE, {});
      client.eventTrigger(ClientEvent.UNAUTHORIZED, {});
      client.eventTrigger(ClientEvent.UNAUTHORIZED, {});
      expect(getCall1Count()).toBe(1);
      expect(getCall2Count()).toBe(2);
      disposer1();
      disposer2();
      client.eventTrigger(ClientEvent.STATUS_CHANGE, {});
      client.eventTrigger(ClientEvent.UNAUTHORIZED, {});
      expect(getCall1Count()).toBe(1);
      expect(getCall2Count()).toBe(2);
    });
    it('setError triggers event', () => {
      const [, , errorListenerMock] = createMocks();
      const { getCallCount, getLastCallPayload } = errorListenerMock;
      const firstError: ClientErrorObject = { type: 'foo1', message: 'bar1' };
      const secondError: ClientErrorObject = { type: 'foo2', message: 'bar2' };
      expect(client.setError(firstError)).toBe(true);
      expect(getCallCount()).toBe(1);
      expect(getLastCallPayload()).toEqual(firstError);
      expect(client.setError(secondError)).toBe(true);
      expect(getCallCount()).toBe(2);
      expect(getLastCallPayload()).toEqual(secondError);
    });
  });
  describe('fetchApiToken makes requests ', () => {
    beforeAll(() => fetchMock.enableMocks());
    afterAll(() => fetchMock.disableMocks());
    afterEach(() => fetchMock.resetMocks());
    const createOkResponse = (responseBody: string | AnyObject) => ({
      status: 200,
      body:
        typeof responseBody === 'string'
          ? responseBody
          : JSON.stringify(responseBody)
    });
    const apiTokenResponseBody = {
      access_token: 'returned-accessToken',
      data: true
    };
    const apiTokenResponse = createOkResponse(apiTokenResponseBody);

    const fetchConfig: FetchApiTokenConfiguration = {
      uri: getTokenUri({
        ...getClientConfig(),
        realm: 'realm-value'
      }),
      accessToken: 'accessToken-value',
      audience: 'audience-value'
    };
    let lastRequest: Request;
    it('where access token is added to headers and audience is in the body. GrantType and permission are not added to body, if not set', async () => {
      fetchMock.mockIf(fetchConfig.uri, req => {
        lastRequest = req;
        return Promise.resolve(apiTokenResponse);
      });
      config.apiGrantType = '';
      config.apiPermission = '';
      await client.fetchApiToken(fetchConfig);
      const requestData = new URLSearchParams(await lastRequest.text());
      expect(
        lastRequest.headers
          .get('Authorization')
          ?.includes(fetchConfig.accessToken)
      ).toBe(true);
      expect(requestData.get('audience')).toBe(fetchConfig.audience);
      expect(requestData.get('permission')).toBeNull();
      expect(requestData.get('grant_type')).toBeNull();
    });
    it('where grantType and permission are added to body, if set', async () => {
      fetchMock.mockIf(fetchConfig.uri, req => {
        lastRequest = req;
        return Promise.resolve(apiTokenResponse);
      });
      config.apiGrantType = 'apiGrantType';
      config.apiPermission = 'apiPermission';
      await client.fetchApiToken(fetchConfig);
      const requestData = new URLSearchParams(await lastRequest.text());
      expect(requestData.get('audience')).toBe(fetchConfig.audience);
      expect(requestData.get('permission')).toBe(config.apiPermission);
      expect(requestData.get('grant_type')).toBe(config.apiGrantType);
    });
    it('and data from server is returned to caller and stored to client', async () => {
      fetchMock.mockIf(fetchConfig.uri, () =>
        Promise.resolve(apiTokenResponse)
      );

      const returnedData = await client.fetchApiToken(fetchConfig);
      const assumedTokenData = {
        [fetchConfig.audience]: apiTokenResponseBody.access_token
      };
      expect(returnedData).toEqual(assumedTokenData);
      const storedData = client.getApiToken(fetchConfig.audience);
      expect(storedData).toEqual(assumedTokenData[fetchConfig.audience]);
    });
    it('and server side error is handled', async () => {
      const responseData = {
        status: 400,
        body: 'an error'
      };
      fetchMock.mockIf(fetchConfig.uri, () => Promise.resolve(responseData));
      const response = (await client.fetchApiToken(fetchConfig)) as FetchError;
      expect(response.status).toBe(responseData.status);
      expect(response.error).toBeDefined();
      if (response.error) {
        expect(response.error.message).toBe(responseData.body);
      }
    });
    it('and network / cors error is handled', async () => {
      const responseData = new Error('network error');
      fetchMock.mockIf(fetchConfig.uri, () => Promise.reject(responseData));
      const response = (await client.fetchApiToken(fetchConfig)) as FetchError;
      expect(response.error).toBeDefined();
      if (response.error) {
        expect(response.error.message).toBe(responseData.message);
      }
    });
    it('and json parse error is handled', async () => {
      const responseData = createOkResponse('{a:invalidjson}');
      fetchMock.mockIf(fetchConfig.uri, () => Promise.resolve(responseData));
      const response = (await client.fetchApiToken(fetchConfig)) as FetchError;
      expect(response.error).toBeDefined();
      expect(response.message).toBeDefined();
      if (response.error) {
        expect(response.error.message).toBeDefined();
      }
    });
    it('if apiToken response includes multiple tokens, all tokens are stored and not fetched again.', async () => {
      const responseBody = {
        [config.exampleApiTokenAudience]: 'exampleApiToken',
        [config.profileApiTokenAudience]: 'profileApiToken'
      };
      fetchMock.mockIf(fetchConfig.uri, () =>
        Promise.resolve(createOkResponse(responseBody))
      );

      const exampleTokenConfig = {
        ...fetchConfig,
        audience: config.exampleApiTokenAudience
      };
      const exampleApiTokens = await client.fetchApiToken(exampleTokenConfig);

      const assumedTokenData = {
        [exampleTokenConfig.audience]: responseBody[exampleTokenConfig.audience]
      };

      expect(exampleApiTokens).toEqual(assumedTokenData);
      const storedData = client.getApiToken(exampleTokenConfig.audience);
      expect(storedData).toEqual(assumedTokenData[exampleTokenConfig.audience]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const profileTokenConfig = {
        ...fetchConfig,
        audience: config.profileApiTokenAudience
      };

      const profileApiTokens = await client.fetchApiToken(profileTokenConfig);
      expect(profileApiTokens).toEqual({
        [profileTokenConfig.audience]: responseBody[profileTokenConfig.audience]
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    it('Api tokens can also be an object with an "access_token" property. In this case there cannot be multiple tokens in the response.', async () => {
      const exampleApiTokenBody = {
        access_token: 'exampleApiToken'
      };
      fetchMock.mockIf(fetchConfig.uri, () =>
        Promise.resolve(createOkResponse(exampleApiTokenBody))
      );

      const exampleTokenConfig = {
        ...fetchConfig,
        audience: config.exampleApiTokenAudience
      };
      const exampleApiTokens = (await client.fetchApiToken(
        exampleTokenConfig
      )) as JWTPayload;

      expect(exampleApiTokens[exampleTokenConfig.audience]).toEqual(
        exampleApiTokenBody.access_token
      );
      expect(client.getApiToken(exampleTokenConfig.audience)).toEqual(
        exampleApiTokenBody.access_token
      );

      // get another token
      const profileApiTokenBody = {
        access_token: 'profileApiToken'
      };
      fetchMock.mockIf(fetchConfig.uri, () =>
        Promise.resolve(createOkResponse(profileApiTokenBody))
      );

      const profileTokenConfig = {
        ...fetchConfig,
        audience: config.profileApiTokenAudience
      };
      expect(client.getApiToken(profileTokenConfig.audience)).toBeUndefined();
      const profileApiTokens = (await client.fetchApiToken(
        profileTokenConfig
      )) as JWTPayload;

      expect(profileApiTokens[profileTokenConfig.audience]).toEqual(
        profileApiTokenBody.access_token
      );
      expect(client.getApiToken(profileTokenConfig.audience)).toEqual(
        profileApiTokenBody.access_token
      );
      // previous apiToken still exists
      expect(client.getApiToken(exampleTokenConfig.audience)).toEqual(
        exampleApiTokenBody.access_token
      );
    });
  });
});
