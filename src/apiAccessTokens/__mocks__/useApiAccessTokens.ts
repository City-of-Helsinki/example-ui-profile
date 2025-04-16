import { GlobalWithFetchMock } from 'jest-fetch-mock';
import { ApiAccessTokenActions, FetchStatus } from '../useApiAccessTokens';
import { JWTPayload } from '../../client';

export type MockApiAccessTokensHookData = {
  apiTokens?: JWTPayload;
  error?: Error | string;
  status: FetchStatus;
};

type GlobalWithPollerData = GlobalWithFetchMock & {
  mockApiAccessTokensHookData: MockApiAccessTokensHookData;
};

const globalWithApiAccessTokensHook = (global as unknown) as GlobalWithPollerData;

if (!globalWithApiAccessTokensHook.mockApiAccessTokensHookData) {
  globalWithApiAccessTokensHook.mockApiAccessTokensHookData = {
    apiTokens: undefined,
    error: undefined,
    status: 'unauthorized'
  };
}
const { mockApiAccessTokensHookData } = globalWithApiAccessTokensHook;

export function getMockApiAccessTokensHookData(): MockApiAccessTokensHookData {
  return mockApiAccessTokensHookData;
}

export function resetMockApiAccessTokensHookData(): void {
  mockApiAccessTokensHookData.apiTokens = undefined;
  mockApiAccessTokensHookData.error = undefined;
  mockApiAccessTokensHookData.status = 'unauthorized';
}

export function resetAndSetMockApiAccessTokensHookData(
  data?: MockApiAccessTokensHookData
): void {
  resetMockApiAccessTokensHookData();
  Object.assign(mockApiAccessTokensHookData, data);
}

export function useApiAccessTokens(audience: string): ApiAccessTokenActions {
  return {
    getStatus: () => mockApiAccessTokensHookData.status,
    getErrorMessage: () => {
      if (!mockApiAccessTokensHookData.error) {
        return undefined;
      }
      if (typeof mockApiAccessTokensHookData.error === 'string') {
        return mockApiAccessTokensHookData.error;
      }
      if (mockApiAccessTokensHookData.error.message) {
        return mockApiAccessTokensHookData.error.message;
      }
      return undefined;
    },
    fetch: options => Promise.resolve(options),
    getToken: () =>
      mockApiAccessTokensHookData.apiTokens
        ? mockApiAccessTokensHookData.apiTokens[audience]
        : undefined
  } as ApiAccessTokenActions;
}
