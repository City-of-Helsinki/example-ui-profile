import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { waitFor } from '@testing-library/react';
import { FetchMock } from 'jest-fetch-mock';
import { configureClient } from '../../client/__mocks__/index';
import { getClient } from '../../client/oidc-react';
import { mockMutatorGetterOidc } from '../../client/__mocks__/oidc-react-mock';
import {
  setUpUser,
  clearApiTokens,
  mockApiTokenResponse,
  setEnv,
  logoutUser
} from '../../tests/client.test.helper';
import {
  ProfileData,
  ProfileActions,
  useProfileWithApiTokens
} from '../profile';
import {
  createValidProfileResponse,
  createInvalidProfileResponse,
  mockProfileResponse
} from '../../tests/profile.test.helper';
import { AnyObject, AnyFunction } from '../../common';
import { FetchStatus } from '../../apiAccessTokens/useApiAccessTokens';

describe('Profile.ts useProfileWithApiTokens hook ', () => {
  configureClient({ tokenExchangePath: '/token-exchange/', autoSignIn: true });
  const fetchMock = (global.fetch as unknown) as FetchMock;
  const mockMutator = mockMutatorGetterOidc();
  const client = getClient();
  const profileBackendUrl = 'https://localhost/profileGraphql/';
  let profileActions: ProfileActions;
  let dom: ReactWrapper;
  let restoreEnv: AnyFunction;

  const ProfileHookTester = (): React.ReactElement => {
    profileActions = useProfileWithApiTokens();
    return (
      <div>
        <div id="request-status">{profileActions.getRequestStatus()}</div>;
        <div id="api-token-status">{profileActions.getApiTokenStatus()}</div>;
      </div>
    );
  };

  const TestWrapper = (): React.ReactElement => (
    <>
      <ProfileHookTester />
    </>
  );

  const setUser = async (user: AnyObject): Promise<void> =>
    setUpUser(user, mockMutator, client);

  const setUpTest = async ({
    response,
    returnApiTokenError
  }: {
    response: AnyObject;
    audience?: string;
    returnApiTokenError?: boolean;
    returnError?: boolean;
  }): Promise<void> => {
    mockApiTokenResponse({
      returnError: returnApiTokenError
    });

    mockProfileResponse({
      response,
      profileBackendUrl
    });

    dom = mount(<TestWrapper />);
  };

  beforeAll(async () => {
    restoreEnv = setEnv({
      REACT_APP_PROFILE_BACKEND_URL: profileBackendUrl
    });
    fetchMock.enableMocks();
    await client.init();
  });

  afterAll(() => {
    restoreEnv();
    fetchMock.disableMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
    mockMutator.resetMock();
  });

  beforeEach(() => {
    if (dom && dom.length) {
      dom.unmount();
    }
    logoutUser(client);
    clearApiTokens(client);
  });

  const getProfileStatus = (): FetchStatus | undefined => {
    dom.update();
    const el = dom.find('#request-status').at(0);
    return el && el.length ? (el.text() as FetchStatus) : undefined;
  };

  const getApiAccessTokenStatus = (): FetchStatus | undefined => {
    dom.update();
    const el = dom.find('#api-token-status').at(0);
    return el && el.length ? (el.text() as FetchStatus) : undefined;
  };

  it('depends on apiAccessToken hook and changes with it', async () => {
    await act(async () => {
      await setUpTest({
        response: createValidProfileResponse()
      });
      await waitFor(() =>
        expect(getApiAccessTokenStatus()).toBe('unauthorized')
      );
      await setUser({});
      await waitFor(() => expect(getApiAccessTokenStatus()).toBe('loaded'));
      await waitFor(() => expect(getProfileStatus()).toBe('loading'));
      await waitFor(() => expect(getProfileStatus()).toBe('loaded'));
      expect((profileActions.getData() as ProfileData).firstName).toEqual(
        'firstName'
      );
    });
  });

  it('provides a "fetch"-action that requests data', async () => {
    await act(async () => {
      await setUpTest({
        response: createValidProfileResponse()
      });
      await setUser({});
      await waitFor(() => expect(getProfileStatus()).toBe('loaded'));
      mockProfileResponse({
        response: createInvalidProfileResponse(),
        profileBackendUrl
      });
      profileActions.request({});
      await waitFor(() => expect(getProfileStatus()).toBe('error'));
      mockProfileResponse({
        response: createValidProfileResponse(),
        profileBackendUrl
      });
      profileActions.request({});
      await waitFor(() => expect(getProfileStatus()).toBe('loaded'));
    });
  });

  it('provides a "clear"-action that clears stored profile data and sets status back to "ready"', async () => {
    await act(async () => {
      await setUser({});
      await setUpTest({
        response: createValidProfileResponse()
      });

      await waitFor(() => expect(getApiAccessTokenStatus()).toBe('loaded'));
      await waitFor(() => expect(getProfileStatus()).toBe('loaded'));
      expect(profileActions.getData()).toBeDefined();
      profileActions.clear();
      expect(profileActions.getData()).toBeUndefined();
      expect(profileActions.getStatus()).toBe('ready');
    });
  });

  it('profile data is cleared, when user logs out and status is set to "error", because user is unauthorized', async () => {
    await act(async () => {
      await setUser({});
      await setUpTest({
        response: createValidProfileResponse()
      });

      await waitFor(() => expect(getApiAccessTokenStatus()).toBe('loaded'));
      await waitFor(() => expect(getProfileStatus()).toBe('loaded'));
      logoutUser(client);
      await waitFor(() => expect(getProfileStatus()).toBe('error'));
      expect(profileActions.getData()).toBeUndefined();
    });
  });
});
