import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OidcCallback from '../../client/OidcCallback';
import { useClientCallback } from '../../client/hooks';

vi.mock('../../client/hooks', () => ({
  useClientCallback: vi.fn(),
}));

const mockedUseClientCallback = vi.mocked(useClientCallback);

const LocationProbe = (): React.ReactElement => {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
};

describe('OidcCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state and redirects based on authentication', () => {
    const client = {
      isInitialized: vi.fn(() => false),
      isAuthenticated: vi.fn(() => false),
    };
    mockedUseClientCallback.mockReturnValue(client as never);

    const { rerender } = render(
      <MemoryRouter initialEntries={['/callback']}>
        <OidcCallback successRedirect="/success" failureRedirect="/failure" />
        <LocationProbe />
      </MemoryRouter>,
    );
    expect(screen.getByText('Tarkistetaan kirjautumistietoja...')).toBeTruthy();

    client.isInitialized.mockReturnValue(true);
    client.isAuthenticated.mockReturnValue(true);
    rerender(
      <MemoryRouter initialEntries={['/callback']}>
        <OidcCallback successRedirect="/success" failureRedirect="/failure" />
        <LocationProbe />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('location').textContent).toBe('/success');

    client.isAuthenticated.mockReturnValue(false);
    rerender(
      <MemoryRouter initialEntries={['/callback']}>
        <OidcCallback successRedirect="/success" failureRedirect="/failure" />
        <LocationProbe />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('location').textContent).toBe('/failure');
  });
});
