import React, { useState } from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { waitFor } from '@testing-library/react';
import { FetchMock } from 'jest-fetch-mock';
import { FetchStatus } from '../useApiAccessTokens';
import useAuthorizedApiRequests, {
  AuthorizedApiActions,
  AuthorizedRequest
} from '../useAuthorizedApiRequests';
import initMockResponses, {
  MockResponseProps
} from '../../tests/backend.test.helper';
import {
  getMockApiAccessTokensHookData,
  resetMockApiAccessTokensHookData,
  MockApiAccessTokensHookData,
  resetAndSetMockApiAccessTokensHookData
} from '../__mocks__/useApiAccessTokens';
import { getFetchMockLastCallAuthenticationHeader } from '../../tests/common.test.helper';
import { mockApiTokenResponse } from '../../tests/client.test.helper';
import { configureClient } from '../../client/__mocks__';

type TestProps = {
  autoFetchProp: boolean;
  data?: string;
  audience?: string;
};
type TestResponseData = {
  something: boolean;
};
type Request = AuthorizedRequest<TestResponseData, TestProps>;

jest.mock('../../apiAccessTokens/useApiAccessTokens');

describe('useAuthorizedApiRequests hook ', () => {
  let authorizedApiActions: AuthorizedApiActions<TestResponseData, TestProps>;
  let dom: ReactWrapper;
  let autoFetch = false;
  let forceUpdate: React.Dispatch<React.SetStateAction<number>>;
  const mockApiAccessTokensActions = getMockApiAccessTokensHookData();
  const fetchMock = (global.fetch as unknown) as FetchMock;
  const config = configureClient();
  const testAudience = config.profileApiTokenAudience;
  const noDataText = 'NO_DATA';
  const requestUrl = 'http://localhost/';
  const responseData: TestResponseData = { something: true };
  const autoFetchProp: { data: TestProps } = { data: { autoFetchProp: true } };
  const requestTracker = jest.fn();
  const setRequestMockResponse = initMockResponses(
    fetchMock,
    requestUrl,
    responseData
  );
  const validTokens = { [testAudience]: 'apiToken' };

  const req: Request = async p => {
    const headers = new Headers();
    headers.append('Authorization', `Bearer ${p.token}`);
    const fetchResponse = await fetch(requestUrl, {
      method: 'POST',
      headers
    });
    requestTracker(p);
    return fetchResponse.json();
  };

  const HookTester = (): React.ReactElement => {
    authorizedApiActions = useAuthorizedApiRequests<
      TestResponseData,
      TestProps
    >(
      req,
      autoFetch
        ? {
            autoFetchProps: { data: { autoFetchProp: true } },
            audience: testAudience
          }
        : { audience: testAudience }
    );
    const data = authorizedApiActions.getData();
    const [, setNumber] = useState<number>(0);
    forceUpdate = setNumber;
    return (
      <div>
        <div id="api-token-status">
          {authorizedApiActions.getApiTokenStatus()}
        </div>
        <div id="request-status">{authorizedApiActions.getRequestStatus()}</div>
        <div id="status">{authorizedApiActions.getStatus()}</div>
        <div id="data">{data ? JSON.stringify(data) : noDataText}</div>
      </div>
    );
  };

  const TestWrapper = (): React.ReactElement => <HookTester />;

  const setUpTest = async (
    props: {
      apiTokenState?: MockApiAccessTokensHookData;
      backendResponseProps?: MockResponseProps;
    } = {}
  ): Promise<void> => {
    const { apiTokenState, backendResponseProps } = props;
    resetAndSetMockApiAccessTokensHookData(apiTokenState);
    setRequestMockResponse(
      backendResponseProps || {
        responseData
      }
    );

    dom = mount(<TestWrapper />);
  };

  const getDomText = (id: string): FetchStatus | undefined => {
    const text = dom
      .find(`#${id}`)
      .at(0)
      .text();
    return text ? (text as FetchStatus) : undefined;
  };

  const getApiTokenStatusFromDom = (): FetchStatus | undefined =>
    getDomText('api-token-status');

  const getRequestStatusFromDom = (): FetchStatus | undefined =>
    getDomText('request-status');

  const getDataFromDom = (): TestResponseData | undefined => {
    const data = getDomText('data');
    return data && data.length > 1 ? JSON.parse(data) : undefined;
  };

  const updateApiAccessTokenMockStatus = async (
    newStatus: FetchStatus
  ): Promise<void> => {
    mockApiAccessTokensActions.status = newStatus;
    if (newStatus === 'loaded') {
      mockApiAccessTokensActions.apiTokens = validTokens;
    } else {
      mockApiAccessTokensActions.apiTokens = undefined;
    }
    return waitFor(() => {
      forceUpdate(old => old + 1);
      expect(getApiTokenStatusFromDom()).toBe(newStatus);
    });
  };

  const waitForRequestUpdate = async (status: FetchStatus): Promise<void> =>
    waitFor(() => {
      forceUpdate(old => old + 1);
      expect(getRequestStatusFromDom()).toBe(status);
    });

  beforeAll(async () => {
    fetchMock.enableMocks();
  });
  afterAll(() => {
    fetchMock.disableMocks();
  });
  afterEach(() => {
    fetchMock.resetMocks();
    autoFetch = false;
    resetMockApiAccessTokensHookData();
  });
  beforeEach(() => {
    if (dom) {
      dom.unmount();
    }
  });

  it('request-function passed to the hook is auto called with apiTokens when autoFetchProps are set', async () => {
    await act(async () => {
      setRequestMockResponse();
      autoFetch = true;
      await setUpTest();
      await waitFor(() => {
        expect(getApiTokenStatusFromDom()).toBe('unauthorized');
        expect(getRequestStatusFromDom()).toBe('waiting');
      });
      await updateApiAccessTokenMockStatus('loaded');
      await waitForRequestUpdate('loaded');
      expect(getDataFromDom()?.something).toBeTruthy();

      const authHeader = getFetchMockLastCallAuthenticationHeader(fetchMock);
      expect(authHeader).toBe(`Bearer ${validTokens[testAudience]}`);
      expect(requestTracker).toHaveBeenCalledTimes(1);
      expect(requestTracker).lastCalledWith({
        token: validTokens[testAudience],
        ...autoFetchProp
      });
    });
  });
  it('request-function passed to the hook is not auto called when autoFetchProps are not set ', async () => {
    await act(async () => {
      await setUpTest();
      await updateApiAccessTokenMockStatus('loaded');
      // api request should not be called
      // therefore tests should never succeed
      // and catch-block should be reached after timeout
      let waitForTimedOut = false;
      try {
        await waitFor(
          () => {
            expect(getRequestStatusFromDom()).not.toEqual('waiting');
            expect(requestTracker.mock.calls.length === 0).toBeFalsy();
          },
          { timeout: 2000 }
        );
      } catch (e) {
        waitForTimedOut = true;
      }
      expect(waitForTimedOut).toBeTruthy();
    });
  });
  it('request-function can be called manually multiple times', async () => {
    await act(async () => {
      const firstCallProps = { data: { autoFetchProp: false, data: '1' } };
      await setUpTest();
      await updateApiAccessTokenMockStatus('loaded');
      authorizedApiActions.request(firstCallProps);
      expect(authorizedApiActions.getRequestStatus()).toBe('loading');
      await waitFor(() => expect(getRequestStatusFromDom()).toBe('loaded'));
      expect(getDataFromDom()).toEqual(responseData);
      expect(requestTracker).toHaveBeenCalledTimes(1);
      expect(requestTracker).lastCalledWith({
        token: validTokens[testAudience],
        ...firstCallProps
      });
      authorizedApiActions.request();
      expect(authorizedApiActions.getRequestStatus()).toBe('loading');
      expect(authorizedApiActions.getData()).toEqual(responseData);
      await waitFor(() =>
        expect(authorizedApiActions.getRequestStatus()).toBe('loaded')
      );
      expect(requestTracker).toHaveBeenCalledTimes(2);
      expect(requestTracker).lastCalledWith({
        token: validTokens[testAudience]
      });
    });
  });
  it('request-function errors are handled and successful request clears the error', async () => {
    await act(async () => {
      await setUpTest({ backendResponseProps: { return401: true } });
      await updateApiAccessTokenMockStatus('loaded');
      expect(authorizedApiActions.getRequestError()).toBeUndefined();
      authorizedApiActions.request({});
      expect(authorizedApiActions.getRequestStatus()).toBe('loading');
      await waitFor(() => expect(getRequestStatusFromDom()).toBe('error'));
      expect(authorizedApiActions.getRequestError()).toBeDefined();

      fetchMock.resetMocks();
      setRequestMockResponse();
      authorizedApiActions.request({});
      expect(authorizedApiActions.getRequestStatus()).toBe('loading');
      await waitFor(() => expect(getRequestStatusFromDom()).toBe('loaded'));
      expect(authorizedApiActions.getRequestError()).toBeUndefined();
      expect(getDataFromDom()).toEqual(responseData);
    });
  });
  it('request-function sets an error when called without apiTokens', async () => {
    await act(async () => {
      mockApiTokenResponse();
      await setUpTest();
      expect(authorizedApiActions.getRequestError()).toBeUndefined();
      authorizedApiActions.request({});
      expect(authorizedApiActions.getRequestError()).toBeDefined();
    });
  });
  it('logging out clears data and sets an error', async () => {
    await act(async () => {
      autoFetch = true;
      await setUpTest();
      await updateApiAccessTokenMockStatus('loaded');
      await waitForRequestUpdate('loaded');
      expect(authorizedApiActions.getData()).toEqual(responseData);
      await updateApiAccessTokenMockStatus('unauthorized');
      await waitForRequestUpdate('error');
      expect(authorizedApiActions.getRequestError()).toBeDefined();
    });
  });
});
