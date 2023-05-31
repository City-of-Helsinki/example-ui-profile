import { useState, useEffect, useCallback, useRef } from 'react';
import to from 'await-to-js';

import { FetchStatus, useApiAccessTokens } from './useApiAccessTokens';
import { JWTPayload } from '../client';

export type RequestProps<P> = {
  data?: P;
};

export type Props<P> = {
  autoFetchProps?: RequestProps<P>;
  audience: string;
};

export type AuthorizedRequestProps<P> = {
  data?: P;
  apiTokens: JWTPayload;
};

export type AuthorizedRequest<R, P> = (
  fetchProps: AuthorizedRequestProps<P>
) => Promise<R | undefined>;

export type AuthorizedApiActions<R, P> = {
  getStatus: () => FetchStatus;
  getApiTokenStatus: () => FetchStatus;
  getRequestStatus: () => FetchStatus;
  getApiTokenError: () => string | undefined;
  getRequestError: () => string | undefined;
  request: (
    props?: Omit<RequestProps<P>, 'audience'>
  ) => Promise<R | undefined>;
  getData: () => R | undefined;
  getTokenAsObject: () => JWTPayload | undefined;
  clear: () => void;
};

export default function useAuthorizedApiRequests<R, P>(
  authorizedRequest: AuthorizedRequest<R, P>,
  props: Props<P>
): AuthorizedApiActions<R, P> {
  const { autoFetchProps, audience } = props;
  const actions = useApiAccessTokens(audience);
  const {
    getStatus: getApiAccessTokenStatus,
    getErrorMessage: getApiTokenErrorMessage,
    getTokenAsObject
  } = actions;
  const [requestStatus, setRequestStatus] = useState<FetchStatus>('waiting');
  const [result, setResult] = useState<R>();
  const [error, setError] = useState<Error>();
  const autoFetchPropsRef = useRef<RequestProps<P> | undefined>(autoFetchProps);

  const resolveStatus = (
    apiAccessTokenStatus: FetchStatus,
    reqStatus: FetchStatus
  ): FetchStatus => {
    if (apiAccessTokenStatus === 'loaded') {
      return 'ready';
    }
    if (apiAccessTokenStatus === 'error') {
      return 'error';
    }

    if (
      reqStatus === 'loading' ||
      reqStatus === 'loaded' ||
      reqStatus === 'error'
    ) {
      return reqStatus;
    }

    return 'waiting';
  };

  const status = resolveStatus(getApiAccessTokenStatus(), requestStatus);

  if (getApiAccessTokenStatus() === 'unauthorized' && result) {
    setResult(undefined);
    setError(new Error('User is unauthorized'));
    setRequestStatus('error');
  }

  const requestWrapper: AuthorizedApiActions<R, P>['request'] = useCallback(
    async wrapperProps => {
      setRequestStatus('loading');
      const [err, data] = await to<R | undefined, Error>(
        authorizedRequest({
          ...wrapperProps,
          apiTokens: getTokenAsObject() as JWTPayload
        })
      );
      if (err) {
        setRequestStatus('error');
        setError(err);
        setResult(undefined);
        return undefined;
      }
      setRequestStatus('loaded');
      setResult(data);
      setError(undefined);
      return data as R;
    },
    [authorizedRequest, getTokenAsObject]
  );

  useEffect(() => {
    if (!autoFetchPropsRef.current || status !== 'ready') {
      return;
    }
    const autoFetch = async (): Promise<void> => {
      requestWrapper(autoFetchPropsRef.current as RequestProps<P>);
      autoFetchPropsRef.current = undefined;
    };
    autoFetch();
  }, [requestWrapper, status]);

  return {
    getStatus: () => status,
    getApiTokenStatus: () => getApiAccessTokenStatus(),
    getRequestStatus: () => requestStatus,
    getApiTokenError: () => getApiTokenErrorMessage(),
    getData: () => result,
    getTokenAsObject: () => getTokenAsObject(),
    getRequestError: () => {
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
    clear: () => {
      setResult(undefined);
      setError(undefined);
    },
    request: requestProps => {
      if (getApiAccessTokenStatus() !== 'loaded') {
        setError(new Error('Api tokens are not fetched.'));
        return Promise.resolve({} as R);
      }
      return requestWrapper(requestProps);
    }
  };
}
