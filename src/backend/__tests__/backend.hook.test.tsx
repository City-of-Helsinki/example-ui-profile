import React, { useState } from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { waitFor } from '@testing-library/react';
import { FetchMock } from 'jest-fetch-mock';
import { setEnv } from '../../tests/client.test.helper';
import { useBackendWithApiTokens, BackendActions } from '../backend';

import { AnyFunction } from '../../common';
import {
  getMockApiAccessTokensHookData,
  resetMockApiAccessTokensHookData,
  MockApiAccessTokensHookData,
  resetAndSetMockApiAccessTokensHookData
} from '../../apiAccessTokens/__mocks__/useApiAccessTokens';
import { FetchStatus } from '../../apiAccessTokens/useApiAccessTokens';
import initMockResponses, {
  MockResponseProps
} from '../../tests/backend.test.helper';
import { configureClient } from '../../client/__mocks__';

jest.mock('../../apiAccessTokens/useApiAccessTokens');

describe('backend.ts useBackendWithApiTokens hook ', () => {
  const mockApiAccessTokensActions = getMockApiAccessTokensHookData();
  const fetchMock: FetchMock = global.fetch;
  configureClient();
  const backendUrl = 'https://localhost/';
  const validResponseData = {
    pet_name: 'petName'
  };
  const setRequestMockResponse = initMockResponses(fetchMock, backendUrl);
  let backendActions: BackendActions;
  let dom: ReactWrapper;
  let restoreEnv: AnyFunction;
  let forceUpdate: React.Dispatch<React.SetStateAction<number>>;

  const HookTester = (): React.ReactElement => {
    const [, setNumber] = useState<number>(0);
    forceUpdate = setNumber;
    backendActions = useBackendWithApiTokens();
    return <div id="request-status">{backendActions.getRequestStatus()}</div>;
  };

  const TestWrapper = (): React.ReactElement => (
    <>
      <HookTester />
    </>
  );

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
        responseData: validResponseData
      }
    );

    dom = mount(<TestWrapper />);
  };

  const updateApiAccessTokenMockStatus = async (
    newStatus: FetchStatus
  ): Promise<void> => {
    mockApiAccessTokensActions.status = newStatus;
    return waitFor(() => {
      forceUpdate(old => old + 1);
      expect(backendActions.getApiTokenStatus()).toBe(newStatus);
    });
  };

  const waitForRequestUpdate = async (status: FetchStatus): Promise<void> =>
    waitFor(() => {
      forceUpdate(old => old + 1);
      expect(backendActions.getRequestStatus()).toBe(status);
    });

  beforeAll(async () => {
    restoreEnv = setEnv({
      REACT_APP_BACKEND_URL: backendUrl
    });
    fetchMock.enableMocks();
  });

  afterAll(() => {
    restoreEnv();
    fetchMock.disableMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
    resetMockApiAccessTokensHookData();
  });

  beforeEach(() => {
    if (dom && dom.length) {
      dom.unmount();
    }
  });

  it('initiates the auto request when api tokens are loaded', async () => {
    await act(async () => {
      await setUpTest();
      await waitFor(() => {
        expect(backendActions.getApiTokenStatus()).toBe('unauthorized');
        expect(backendActions.getRequestStatus()).toBe('waiting');
      });
      await updateApiAccessTokenMockStatus('loaded');
      await waitForRequestUpdate('loaded');
      await waitFor(() =>
        expect(backendActions.getData()).toEqual(validResponseData)
      );
    });
  });

  it('handles errors and manual updates', async () => {
    await act(async () => {
      await setUpTest({ backendResponseProps: { return401: true } });
      await updateApiAccessTokenMockStatus('loaded');
      await waitForRequestUpdate('error');
      fetchMock.resetMocks();
      setRequestMockResponse({
        responseData: validResponseData
      });
      backendActions.request();
      await waitFor(() =>
        expect(backendActions.getData()).toEqual(validResponseData)
      );
    });
  });
});
