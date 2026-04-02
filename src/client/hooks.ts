import React, { useEffect, useState, useRef } from 'react';
import {
  Client,
  ClientErrorObject,
  ClientEvent,
  ClientStatus,
  ClientStatusId,
  ClientError,
} from '.';
import { getClient } from './oidc-react';

export function useClient(): Client {
  const clientRef: React.Ref<Client> = useRef(getClient());
  const clientFromRef: Client = clientRef.current as Client;
  const [, setStatus] = useState<ClientStatusId>(clientFromRef.getStatus());
  useEffect(() => {
    const initClient = async (): Promise<void> => {
      if (!clientFromRef.isInitialized()) {
        await clientFromRef.getOrLoadUser().catch((e) => {
          clientFromRef.setError({
            type: ClientError.INIT_ERROR,
            message: e && e.toString(),
          });
        });
      }
    };
    const statusListenerDisposer = clientFromRef.addListener(
      ClientEvent.STATUS_CHANGE,
      (status) => {
        setStatus(status as ClientStatusId);
      },
    );

    initClient();
    return (): void => {
      statusListenerDisposer();
    };
  }, [clientFromRef]);
  return clientFromRef;
}

export function useClientErrorDetection(): ClientErrorObject {
  const clientRef: React.Ref<Client> = useRef(getClient());
  const clientFromRef: Client = clientRef.current as Client;
  const [error, setError] = useState<ClientErrorObject>(undefined);
  useEffect(() => {
    let isAuthorized = false;
    const statusListenerDisposer = clientFromRef.addListener(
      ClientEvent.STATUS_CHANGE,
      (status) => {
        if (status === ClientStatus.AUTHORIZED) {
          isAuthorized = true;
        }
        if (isAuthorized && status === ClientStatus.UNAUTHORIZED) {
          setError({ type: ClientError.UNEXPECTED_AUTH_CHANGE, message: '' });
          isAuthorized = false;
        }
      },
    );

    const errorListenerDisposer = clientFromRef.addListener(
      ClientEvent.ERROR,
      (newError) => {
        setError(newError as ClientErrorObject);
      },
    );
    const logoutListenerDisposer = clientFromRef.addListener(
      ClientEvent.LOGGING_OUT,
      (): void => {
        isAuthorized = false;
      },
    );

    return (): void => {
      errorListenerDisposer();
      statusListenerDisposer();
      logoutListenerDisposer();
    };
  }, [clientFromRef]);
  return error;
}

export function useClientCallback(): Client {
  const clientRef: React.Ref<Client> = useRef(getClient());
  const clientFromRef: Client = clientRef.current as Client;
  const [, setStatus] = useState<ClientStatusId>(clientFromRef.getStatus());
  useEffect(() => {
    const initClient = async (): Promise<void> => {
      if (clientFromRef.isInitialized()) {
        throw new Error(
          'Client already initialized. This should not happen with callback. When using callback, client should not be initialized more than once.',
        );
      }
      await clientFromRef.handleCallback().catch((e) =>
        clientFromRef.setError({
          type: ClientError.INIT_ERROR,
          message: e && e.toString(),
        }),
      );
    };
    const statusListenerDisposer = clientFromRef.addListener(
      ClientEvent.STATUS_CHANGE,
      (status) => {
        setStatus(status as ClientStatusId);
      },
    );

    initClient();
    return (): void => {
      statusListenerDisposer();
    };
  }, [clientFromRef]);
  return clientFromRef;
}
