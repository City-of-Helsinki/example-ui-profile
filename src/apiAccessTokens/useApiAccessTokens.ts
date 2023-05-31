import { useEffect, useState, useCallback, createContext } from 'react';
import { FetchApiTokenOptions, FetchError, JWTPayload } from '../client/index';
import { useClient } from '../client/hooks';

export type FetchStatus =
  | 'unauthorized'
  | 'ready'
  | 'loading'
  | 'error'
  | 'loaded'
  | 'waiting';

type ApiFetchError = FetchError | string | undefined;

export type ApiAccessTokenActions = {
  fetch: (options: FetchApiTokenOptions) => Promise<JWTPayload | FetchError>;
  getStatus: () => FetchStatus;
  getErrorMessage: () => string | undefined;
  getTokenAsObject: () => JWTPayload | undefined;
};

export const ApiAccessTokenActionsContext = createContext<ApiAccessTokenActions | null>(
  null
);

export function useApiAccessTokens(audience: string): ApiAccessTokenActions {
  const client = useClient();
  const apiToken = client.isAuthenticated()
    ? client.getApiToken(audience)
    : undefined;
  const [apiTokens, setApiTokens] = useState<JWTPayload | undefined>(
    apiToken ? { [audience]: apiToken } : undefined
  );

  const resolveStatus = (): FetchStatus => {
    if (!client.isAuthenticated()) {
      return 'unauthorized';
    }
    if (apiTokens) {
      return 'loaded';
    }
    return 'ready';
  };

  const resolveCurrentStatus = (
    baseStatus: FetchStatus,
    stateStatus: FetchStatus
  ): FetchStatus => {
    if (stateStatus === 'unauthorized' || baseStatus === 'unauthorized') {
      return baseStatus;
    }
    return stateStatus;
  };

  const resolvedStatus = resolveStatus();
  const [status, setStatus] = useState<FetchStatus>(resolvedStatus);
  const [error, setError] = useState<ApiFetchError>();
  const currentStatus = resolveCurrentStatus(resolvedStatus, status);
  if (resolvedStatus === 'unauthorized' && apiTokens) {
    setApiTokens(undefined);
    setStatus('unauthorized');
  }
  const fetchTokens: ApiAccessTokenActions['fetch'] = useCallback(
    async options => {
      setStatus('loading');
      const result = await client.getApiAccessToken(options);
      if ((result as FetchError).error) {
        const resultAsError = result as FetchError;
        setStatus('error');
        setError(
          resultAsError.message
            ? new Error(`${resultAsError.message} ${resultAsError.status}`)
            : resultAsError.error
        );
      } else {
        setError(undefined);
        setApiTokens(result as JWTPayload);
        setStatus('loaded');
      }
      return result;
    },
    [client]
  );

  useEffect(() => {
    const autoFetch = async (): Promise<void> => {
      if (currentStatus !== 'ready') {
        return;
      }
      fetchTokens({
        audience,
        permission: String(window._env_.REACT_APP_API_BACKEND_PERMISSION),
        grantType: String(window._env_.REACT_APP_API_BACKEND_GRANT_TYPE)
      });
    };

    autoFetch();
  }, [fetchTokens, currentStatus, audience]);
  return {
    getStatus: () => status,
    getErrorMessage: () => {
      if (!error) {
        return undefined;
      }
      if (typeof error === 'string') {
        return error;
      }
      if (error.message) {
        return error.message;
      }
      return undefined;
    },
    fetch: options => fetchTokens(options),
    getTokenAsObject: () => apiTokens
  } as ApiAccessTokenActions;
}
