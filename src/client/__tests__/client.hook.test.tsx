import React from 'react';
import { render, act } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { getClient } from '../oidc-react';
import { useClient, useClientErrorDetection } from '../hooks';
import { Client, ClientError, ClientStatus } from '..';
import {
  InstanceIdentifier,
  ClientValues,
  getClientDataFromComponent,
  matchClientDataWithComponent,
  configureClient
} from '../__mocks__';
import { ClientProvider, ClientContext } from '../ClientProvider';
import StoreProvider from '../redux/StoreProvider';
import { StoreState } from '../redux';
import { mockMutatorGetterOidc } from '../__mocks__/oidc-react-mock';
import { AnyFunction } from '../../common';

const ClientDataRenderer = ({
  client,
  id
}: {
  client: Client;
  id: string;
}): React.ReactElement => {
  const error = client.getError();
  const user = client.getUser();
  return (
    <div id={`instance_${id}`}>
      <div className="status">{client.getStatus()}</div>
      <div className="authenticated">{String(client.isAuthenticated())}</div>
      <div className="initialized">{String(client.isInitialized())}</div>
      <div className="error">{error ? error.message : ''}</div>
      <div className="email">{user ? user.email : ''}</div>
    </div>
  );
};

const HookRenderer = ({
  callback,
  id
}: InstanceIdentifier): React.ReactElement => {
  const client = useClient();
  callback({ id, client });
  return <ClientDataRenderer id={id} client={client} />;
};

const ClientConsumer = ({
  callback,
  id
}: InstanceIdentifier): React.ReactElement | null => (
  <ClientContext.Consumer>
    {(value): React.ReactElement | null => {
      const client: Client = (value && value.client) as Client;
      callback({ id, client });
      return <ClientDataRenderer id={id} client={client} />;
    }}
  </ClientContext.Consumer>
);

const ReduxConsumer = ({ id }: { id: string }): React.ReactElement => {
  const state: StoreState = useSelector((storeState: StoreState) => storeState);
  const { user } = state;
  const { error } = state;
  return (
    <div id={`instance_${id}`}>
      <div className="status">{state.status}</div>
      <div className="authenticated">{String(state.authenticated)}</div>
      <div className="initialized">{String(state.initialized)}</div>
      <div className="error">{error ? error.message : ''}</div>
      <div className="email">{user ? user.email : ''}</div>
    </div>
  );
};

const ErrorHookRenderer = (): React.ReactElement => {
  const error = useClientErrorDetection();
  return (
    <div id="errorRenderer">
      <div className="error">{error ? error.message : ''}</div>
    </div>
  );
};

describe('Client consumers ', () => {
  configureClient({ autoSignIn: true });
  const nonHookClient = getClient();
  const mockMutator = mockMutatorGetterOidc();
  const instance1Selector = '#instance_1';
  const instance2Selector = '#instance_2';
  const instance3Selector = '#instance_3';

  const getComponentValues = (selector: string): ClientValues | undefined =>
    getClientDataFromComponent(selector);

  const matchComponentWithClient = (
    selector: string,
    client: Client
  ): ClientValues | undefined => matchClientDataWithComponent(selector, client);

  const getErrorText = (): string =>
    document.querySelector('#errorRenderer .error')?.textContent || '';

  const compareComponentWithRedux = (): void => {
    const values = getComponentValues('#instance_redux');
    const user = nonHookClient.getUser();
    const clientEmail = user ? user.email : undefined;
    const errorObj = nonHookClient.getError();

    expect(values).toEqual({
      status: nonHookClient.getStatus(),
      authenticated: nonHookClient.isAuthenticated(),
      initialized: nonHookClient.isInitialized(),
      error: errorObj ? errorObj.message : undefined,
      email: clientEmail
    });
  };

  const instances: Map<string, Client> = new Map();
  const instanceCount = 4;
  const callback: AnyFunction = props => {
    const { id, client } = props as InstanceIdentifier;
    if (!instances.has(id)) {
      instances.set(id, client as Client);
    }
  };

  const mountDom = (): void => {
    render(
      <ClientProvider>
        <StoreProvider>
          <div>
            <HookRenderer callback={callback} id="1" />
            <HookRenderer callback={callback} id="2" />
            <HookRenderer callback={callback} id="3" />
            <ErrorHookRenderer />
            <ClientConsumer callback={callback} id="consumer" />
            <ReduxConsumer id="redux" />
          </div>
        </StoreProvider>
      </ClientProvider>
    );
  };
  beforeAll(async () => {
    await act(async () => {
      await nonHookClient.init();
    });
  });
  beforeEach(async () => {
    await act(async () => {
      mockMutator.resetMock();
      nonHookClient.setError(undefined);
      mockMutator.setUser();
      nonHookClient.onAuthChange(false);
    });
    mountDom();
  });
  afterEach(() => {
    nonHookClient.clearSession();
  });
  describe('have same instance ', () => {
    it('with same values', async () => {
      expect(instances.size).toBe(instanceCount);
      expect((instances.get('1') as Client).getStatus()).toBe(
        ClientStatus.UNAUTHORIZED
      );
      expect(instances.get('1') === instances.get('2')).toBe(true);
      expect(instances.get('2') === instances.get('3')).toBe(true);
      expect(instances.get('3') === instances.get('consumer')).toBe(true);
      expect(nonHookClient === instances.get('1')).toBe(true);
    });
  });
  describe('Components and consumers using useClient ', () => {
    it('are rendered and updated', async () => {
      matchComponentWithClient(instance1Selector, instances.get('3') as Client);
      matchComponentWithClient(instance2Selector, instances.get('1') as Client);
      matchComponentWithClient(instance3Selector, instances.get('2') as Client);
      matchComponentWithClient('#instance_consumer', nonHookClient);
      const user = mockMutator.createValidUserData({
        email: 'yougot@email.com'
      });
      await act(async () => {
        mockMutator.setUser(user);
        nonHookClient.onAuthChange(true);
      });

      const values = getComponentValues(instance1Selector) as ClientValues;
      expect(values && values.email).toBe(user.email);
      expect((instances.get('3') as Client).getStatus()).toBe(
        ClientStatus.AUTHORIZED
      );
      matchComponentWithClient(instance1Selector, instances.get('3') as Client);
      matchComponentWithClient(instance2Selector, instances.get('1') as Client);
      matchComponentWithClient(instance3Selector, instances.get('2') as Client);
      matchComponentWithClient('#instance_consumer', nonHookClient);
    });

    it('Error hook is triggered and component rendered', async () => {
      expect(getErrorText()).toBe('');
      await act(async () => {
        nonHookClient.setError({
          type: ClientError.UNEXPECTED_AUTH_CHANGE,
          message: ClientError.UNEXPECTED_AUTH_CHANGE
        });
      });
      expect(getErrorText()).toBe(ClientError.UNEXPECTED_AUTH_CHANGE);
    });
    it('Redux consumer render client data and updates', async () => {
      const email = 'redux@react.js';
      compareComponentWithRedux();
      await act(async () => {
        nonHookClient.setError({
          type: ClientError.UNEXPECTED_AUTH_CHANGE,
          message: ClientError.UNEXPECTED_AUTH_CHANGE
        });
        mockMutator.setUser(mockMutator.createValidUserData({ email }));
        nonHookClient.onAuthChange(true);
      });
      compareComponentWithRedux();
      const values = getComponentValues('#instance_redux');
      expect(values).toBeDefined();
      if (values) {
        expect(values.email).toBe(email);
      }
    });
  });
});
