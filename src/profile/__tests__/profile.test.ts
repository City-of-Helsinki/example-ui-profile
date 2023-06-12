import { FetchMock } from 'jest-fetch-mock';
import {
  convertQueryToData,
  getProfileData,
  getProfileGqlClient,
  ProfileQueryResult
} from '../profile';
import { getClient } from '../../client/oidc-react';
import { mockMutatorGetterOidc } from '../../client/__mocks__/oidc-react-mock';
import {
  clearApiTokens,
  logoutUser,
  setEnv
} from '../../tests/client.test.helper';
import {
  createInvalidProfileResponse,
  createValidProfileResponse,
  createValidProfileResponseData,
  mockProfileResponse
} from '../../tests/profile.test.helper';
import { configureClient } from '../../client/__mocks__';
import { FetchError } from '../../client';
import { AnyFunction } from '../../common';
import { GraphQLClientError } from '../../graphql/graphqlClient';

describe('Profile.ts', () => {
  const config = configureClient();
  const fetchMock: FetchMock = global.fetch;
  const mockMutator = mockMutatorGetterOidc();
  const client = getClient();
  let restoreEnv: AnyFunction;
  const testAudience = config.profileApiTokenAudience;
  const profileBackendUrl = 'https://localhost/profileGraphql/';
  let lastRequest: Request;

  const validAPiToken = { [testAudience]: 'valid-api-token' };

  const setValidApiToken = (): string => {
    client.addApiTokens(validAPiToken);
    return validAPiToken[testAudience];
  };

  const isApiTokenInRequest = (req: Request): boolean => {
    const { headers } = req;
    const authHeader = headers.get('Authorization');
    const profileToken = validAPiToken[testAudience];
    return !!(authHeader && authHeader.includes(`Bearer ${profileToken}`));
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
    logoutUser(client);
    clearApiTokens(client);
  });

  it('convertQueryToData() extracts actual profile data from graphql response or return undefined', async () => {
    const email = 'email@dom.com';
    const emailDataTree = { emails: { edges: [{ node: { email } }] } };
    const response = createValidProfileResponseData(emailDataTree);
    const data = convertQueryToData(
      (response as unknown) as ProfileQueryResult
    );
    expect(data && data.email).toBe(email);
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('firstName');
    expect(
      convertQueryToData((emailDataTree as unknown) as ProfileQueryResult)
    ).toBeUndefined();
  });

  it('getProfileGqlClient() returns client or undefined if api token is not set', () => {
    const undefinedBeforeApiTokenIsSet = getProfileGqlClient();
    expect(undefinedBeforeApiTokenIsSet).toBeUndefined();
    const token = setValidApiToken();
    const gqlclient = getProfileGqlClient(token);
    expect(gqlclient).toBeDefined();
  });

  it('getProfileData() returns FetchError or ProfileData', async () => {
    const errorBecauseApiTokenNotSet: FetchError = (await getProfileData()) as GraphQLClientError;
    expect(errorBecauseApiTokenNotSet.error).toBeDefined();
    const token = setValidApiToken();
    mockProfileResponse({
      response: createInvalidProfileResponse(),
      profileBackendUrl
    });
    const serverErrorResponse: FetchError = (await getProfileData(
      token
    )) as GraphQLClientError;
    expect(serverErrorResponse.error).toBeDefined();
    // must reset before new call to same url
    fetchMock.resetMocks();
    mockProfileResponse({
      requestCallback: (req: unknown): void => {
        lastRequest = req as Request;
      },
      response: createValidProfileResponse(),
      profileBackendUrl
    });
    const res = (await getProfileData(token)) as ProfileQueryResult;
    expect(res.data.myProfile?.firstName).toBe('firstName');
    expect(isApiTokenInRequest(lastRequest)).toBe(true);
  });
});
