import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ClientGetUser from '../ClientGetUser';
import { getClient } from '../../client/oidc-react';

vi.mock('../../client/oidc-react', () => ({
  getClient: vi.fn(),
}));

const mockedGetClient = vi.mocked(getClient);

describe('ClientGetUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading, user info, and error states', async () => {
    const client = {
      loadUserProfile: vi
        .fn()
        .mockResolvedValueOnce({ profile: { email: 'user@example.com' } })
        .mockRejectedValueOnce(new Error('profile failed')),
    };
    mockedGetClient.mockReturnValue(client as never);

    const { unmount } = render(<ClientGetUser />);
    expect(screen.getByText('Ladataan....')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('User info')).toBeTruthy());
    expect(screen.getByText(/user@example.com/)).toBeTruthy();

    unmount();
    render(<ClientGetUser />);
    await waitFor(() =>
      expect(screen.getByText('User infon lataus epäonnistui')).toBeTruthy(),
    );
  });
});
