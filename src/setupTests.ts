// eslint-disable-next-line import/no-extraneous-dependencies
import { GlobalWithFetchMock } from 'jest-fetch-mock';
import { UserManager, UserManagerSettings } from 'oidc-client-ts';
import {
  mockMutatorGetterOidc,
  mockOidcUserManager
} from './client/__mocks__/oidc-react-mock';
import { AnyFunction } from './common';

const customGlobal: GlobalWithFetchMock = global as GlobalWithFetchMock;
// jest-fetch-mock internally calls jest.fn(), alias vi as jest so it works with Vitest
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).jest = vi;
// eslint-disable-next-line import/no-extraneous-dependencies
customGlobal.fetch = require('jest-fetch-mock');

customGlobal.fetchMock = customGlobal.fetch;

vi.mock('react-router', async () => ({
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: expected ts type error
  ...(await vi.importActual('react-router')),
  useHistory: (): Record<string, AnyFunction> => ({
    push: vi.fn()
  })
}));

vi.mock('./config', async () => {
  await vi.importActual('../public/test-env-config');
  return vi.importActual('./config');
});

vi.mock('oidc-client-ts', async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = (await vi.importActual('oidc-client-ts')) as any;
  class MockUserManagerClass {
    constructor(settings: UserManagerSettings) {
      const mockMutator = mockMutatorGetterOidc();
      const userManager = mockOidcUserManager(settings) as UserManager;
      mockMutator.setInstance(userManager);
      return userManager;
    }
  }
  return {
    ...actual,
    UserManager: MockUserManagerClass
  };
});

vi.mock('./client/http-poller');
