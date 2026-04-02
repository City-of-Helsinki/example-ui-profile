import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { FetchMock } from 'jest-fetch-mock';
import { configureClient } from '../../client/__mocks__/index';
import { getClient } from '../../client/oidc-react';
import { mockMutatorGetterOidc } from '../../client/__mocks__/oidc-react-mock';
import {
  setUpUser,
  mockApiTokenResponse,
  logoutUser,
  clearApiTokens,
  createApiTokenFetchPayload,
} from '../../tests/client.test.helper';
import { AnyObject } from '../../common';
import {
  useApiAccessTokens,
  ApiAccessTokenActions,
  FetchStatus,
} from '../useApiAccessTokens';

describe('useApiAccessTokens hook ', () => {
  configureClient({ tokenExchangePath: '/token-exchange/' });
  const fetchMock = global.fetch as unknown as FetchMock;
  const mockMutator = mockMutatorGetterOidc();
  const client = getClient();
  const config = configureClient();
  const testAudience = config.profileApiTokenAudience;
  let apiTokenActions: ApiAccessTokenActions;
  let unmount: () => void;

  const HookTester = (): React.ReactElement => {
    apiTokenActions = useApiAccessTokens(testAudience);
    return <div id="api-token-status">{apiTokenActions.getStatus()}</div>;
  };

  const setUser = async (user: AnyObject): Promise<void> =>
    setUpUser(user, mockMutator, client);

  const setUpTest = async (props?: {
    user?: AnyObject;
    apiToken?: string;
  }): Promise<void> => {
    const { user } = props || {};
    if (user) {
      await setUser(user);
    }
    ({ unmount } = render(<HookTester />));
  };

  beforeAll(async () => {
    fetchMock.enableMocks();
    await client.init();
  });
  afterAll(() => {
    fetchMock.disableMocks();
  });
  afterEach(() => {
    fetchMock.resetMocks();
    mockMutator.resetMock();
  });
  beforeEach(() => {
    if (unmount) {
      unmount();
    }
    logoutUser(client);
    clearApiTokens(client);
  });

  const getApiTokenStatus = (): FetchStatus | undefined => {
    const text = document.getElementById('api-token-status')?.textContent;
    return text ? (text as FetchStatus) : undefined;
  };

  it('status depends on client and changes with it', async () => {
    await act(async () => {
      await setUpTest();
      await waitFor(() => expect(getApiTokenStatus()).toBe('unauthorized'));
      expect(apiTokenActions.getToken()).toBeUndefined();
      expect(apiTokenActions.getStatus() === 'unauthorized');
      const tokens = mockApiTokenResponse({ audience: testAudience });
      await setUser({});
      await waitFor(() => expect(getApiTokenStatus()).toBe('loading'));
      await waitFor(() => expect(getApiTokenStatus()).toBe('loaded'));
      expect(apiTokenActions.getToken()).toEqual(tokens[testAudience]);
      logoutUser(client);
      await waitFor(() => expect(getApiTokenStatus()).toBe('unauthorized'));
      expect(apiTokenActions.getToken()).toBeUndefined();
    });
  });

  it('can be controlled with actions', async () => {
    await act(async () => {
      await setUpTest();
      await waitFor(() => expect(getApiTokenStatus()).toBe('unauthorized'));
      expect(apiTokenActions.getToken()).toBeUndefined();
      expect(apiTokenActions.getStatus() === 'unauthorized');
      mockApiTokenResponse({ returnError: true });
      await setUser({});
      await waitFor(() => expect(getApiTokenStatus()).toBe('error'));
      expect(apiTokenActions.getToken()).toBeUndefined();
      const tokens = mockApiTokenResponse({ audience: testAudience });
      apiTokenActions.fetch(
        createApiTokenFetchPayload({ audience: testAudience }),
      );
      await waitFor(() => expect(getApiTokenStatus()).toBe('loaded'));
      expect(apiTokenActions.getToken()).toEqual(tokens[testAudience]);
    });
  });

  it('api token is auto fetched when user is authorized', async () => {
    await act(async () => {
      const tokens = mockApiTokenResponse({ audience: testAudience });
      await setUpTest({
        user: {},
      });
      await waitFor(() => expect(getApiTokenStatus()).toBe('loading'));
      await waitFor(() => expect(getApiTokenStatus()).toBe('loaded'));
      expect(apiTokenActions.getToken()).toEqual(tokens[testAudience]);
    });
  });
  it('api tokens are cleared when user logs out', async () => {
    await act(async () => {
      await setUpTest({
        user: {},
      });
      mockApiTokenResponse();
      await waitFor(() => expect(getApiTokenStatus()).toBe('loaded'));
      logoutUser(client);
      await waitFor(() => expect(getApiTokenStatus()).toBe('unauthorized'));
      expect(apiTokenActions.getToken()).toBeUndefined();
    });
  });
});
