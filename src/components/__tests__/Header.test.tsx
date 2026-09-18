import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Header from '../Header';
import { getClientConfig } from '../../client';
import { useClient } from '../../client/hooks';

const mockedNavigate = vi.hoisted(() => vi.fn());

vi.mock('../../client/hooks', () => ({
  useClient: vi.fn(),
}));

// eslint-disable-next-line sonarjs/no-duplicate-string
vi.mock('react-router', async () => {
  const actual =
    await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

// eslint-disable-next-line sonarjs/no-duplicate-string
vi.mock('../../client', async () => {
  const actual =
    await vi.importActual<typeof import('../../client')>('../../client');
  return {
    ...actual,
    getClientConfig: vi.fn(),
  };
});

const mockedUseClient = vi.mocked(useClient);
const mockedGetClientConfig = vi.mocked(getClientConfig);

const renderHeader = (client: Record<string, unknown>): void => {
  mockedUseClient.mockReturnValue(client as never);
  mockedGetClientConfig.mockReturnValue({ path: '/demo' } as never);
  render(
    <MemoryRouter initialEntries={['/demo']}>
      <Header />
    </MemoryRouter>,
  );
};

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login action and navigates from the unauthenticated header', () => {
    const login = vi.fn();
    renderHeader({
      isAuthenticated: () => false,
      isInitialized: () => true,
      getUser: () => undefined,
      login,
      logout: vi.fn(),
    });

    expect(
      // eslint-disable-next-line sonarjs/no-duplicate-string
      screen.getByRole('button', { name: 'Kirjaudu sisään' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Kirjaudu sisään' }));
    expect(login).toHaveBeenCalledOnce();

    const profileLink = document.querySelector(
      '[data-test-id="header-link-profile"]',
    );
    expect(profileLink).toBeTruthy();
    fireEvent.click(profileLink as HTMLElement);
    expect(mockedNavigate).toHaveBeenCalledWith('/demo/profile');
  });

  it('renders the authenticated user and logout action', () => {
    const logout = vi.fn();
    renderHeader({
      isAuthenticated: () => true,
      isInitialized: () => true,
      getUser: () => ({ given_name: 'Teppo', family_name: 'Testaaja' }),
      login: vi.fn(),
      logout,
    });

    expect(screen.getByText('Teppo Testaaja')).toBeTruthy();
    const logoutButton = screen.getByRole('button', { name: 'Kirjaudu ulos' });
    expect(logoutButton).toBeTruthy();
    fireEvent.click(logoutButton);
    expect(logout).toHaveBeenCalledOnce();
    expect(screen.getByText('Helsinki-profiili')).toBeTruthy();
  });

  it('does not render auth actions before client initialization', () => {
    renderHeader({
      isAuthenticated: () => false,
      isInitialized: () => false,
      getUser: () => undefined,
      login: vi.fn(),
      logout: vi.fn(),
    });

    expect(
      screen.queryByRole('button', { name: 'Kirjaudu sisään' }),
    ).toBeNull();
    expect(screen.queryByRole('button', { name: 'Kirjaudu ulos' })).toBeNull();
  });
});
