import to from 'await-to-js';
import { useCallback } from 'react';
import useAuthorizedApiRequests, {
  AuthorizedRequest,
  AuthorizedApiActions
} from '../apiAccessTokens/useAuthorizedApiRequests';
import { getClientConfig } from '../client';

// eslint-disable-next-line camelcase
export type ReturnData = { pet_name: string };
// eslint-disable-next-line camelcase
type FetchProps = ReturnData | undefined;
type Request = AuthorizedRequest<ReturnData, FetchProps>;
export type BackendActions = AuthorizedApiActions<ReturnData, FetchProps>;

export const executeAPIAction: Request = async options => {
  const myHeaders = new Headers();
  myHeaders.append('Authorization', `Bearer ${options.token}`);
  myHeaders.append('Content-Type', 'application/json');
  myHeaders.delete('pragma');
  const requestOptions: RequestInit = {
    method: 'GET',
    headers: myHeaders
  };
  if (options?.data) {
    requestOptions.method = 'PUT';
    requestOptions.body = JSON.stringify(options.data);
  }
  const [fetchError, fetchResponse]: [
    Error | null,
    Response | undefined
  ] = await to(
    fetch(window._env_.REACT_APP_BACKEND_URL as string, requestOptions)
  );
  if (fetchError || !fetchResponse) {
    throw new Error('Network or CORS error occured');
  }
  if (!fetchResponse.ok) {
    const error = await fetchResponse.text();
    throw new Error(`Status:${fetchResponse.status}. Message: ${error}`);
  }
  const [parseError, json] = await to(fetchResponse.json());
  if (parseError) {
    throw new Error('Returned data is not valid json');
  }
  return json;
};

export function useBackendWithApiTokens(): AuthorizedApiActions<
  ReturnData,
  FetchProps
> {
  const req: Request = useCallback(async props => executeAPIAction(props), []);
  const config = getClientConfig();
  return useAuthorizedApiRequests(req, {
    audience: config.exampleApiTokenAudience,
    autoFetchProps: {}
  });
}
