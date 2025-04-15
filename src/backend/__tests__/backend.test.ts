import { FetchMock } from 'jest-fetch-mock';
import { setEnv } from '../../tests/client.test.helper';
import { AnyFunction } from '../../common';
import { executeAPIAction } from '../backend';
import {
  getFetchMockLastCallAuthenticationHeader,
  getFetchMockLastCall
} from '../../tests/common.test.helper';
import initMockResponses from '../../tests/backend.test.helper';

describe('Backend.ts ', () => {
  let restoreEnv: AnyFunction;
  const fetchMock = (global.fetch as unknown) as FetchMock;
  const backendUrl = 'https://localhost/';
  const responseData = { pet_name: 'petName' };
  const usersAPiToken = 'valid-api-token';
  const setRequestMockResponse = initMockResponses(
    fetchMock,
    backendUrl,
    responseData
  );

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
  });

  it('calling executeApiAction() adds apiToken to headers. Requests is sent to backend with method "GET" when data is not provided', async () => {
    setRequestMockResponse();
    const res = await executeAPIAction({ token: usersAPiToken });
    expect(res).toEqual(responseData);
    const authHeader = getFetchMockLastCallAuthenticationHeader(fetchMock);
    expect(authHeader).toBe(`Bearer ${usersAPiToken}`);
  });

  it('calling executeApiAction() with data-property changes method to "PUT" and sends the data with the request', async () => {
    setRequestMockResponse();
    const data = { pet_name: 'bar' };
    await executeAPIAction({ data, token: usersAPiToken });
    const lastCallRequestInit = getFetchMockLastCall(fetchMock)[1];
    expect(lastCallRequestInit?.method).toBe('PUT');
    expect(lastCallRequestInit?.body).toBe(JSON.stringify(data));
  });

  it('executeApiAction() throws an error when request fails', async () => {
    setRequestMockResponse({ return401: true });
    await expect(async () => {
      await executeAPIAction({ token: usersAPiToken });
    }).rejects.toThrow();
  });

  it('executeApiAction() throws an error when json is malformed', async () => {
    setRequestMockResponse({ causeException: true });
    await expect(async () => {
      await executeAPIAction({ token: usersAPiToken });
    }).rejects.toThrow();
  });
});
