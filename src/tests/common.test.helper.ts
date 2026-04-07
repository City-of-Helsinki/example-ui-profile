import fetchMock from '@fetch-mock/vitest';

type FetchMock = typeof fetchMock;

export const getFetchMockLastCall = (
  fetchMock: FetchMock,
): [string | Request | undefined, RequestInit | undefined] => {
  const lastCall = fetchMock.callHistory.lastCall();
  return (lastCall?.args || []) as [
    string | Request | undefined,
    RequestInit | undefined,
  ];
};

export const getFetchMockLastCallAuthenticationHeader = (
  fetchMock: FetchMock,
): string | null => {
  const lastCall = getFetchMockLastCall(fetchMock);
  const requestInit = lastCall[1];
  if (requestInit?.headers) {
    return new Headers(requestInit.headers).get('Authorization');
  }
  const request = lastCall[0];
  if (request instanceof Request) {
    return request.headers.get('Authorization');
  }
  return null;
};
