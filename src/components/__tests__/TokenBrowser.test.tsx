import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TokenBrowser from '../TokenBrowser';
import { useClient } from '../../client/hooks';
import { getClientConfig } from '../../client';

vi.mock('../../client/hooks', () => ({
  useClient: vi.fn(),
}));

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

describe('TokenBrowser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('decodes selected API and user tokens', () => {
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ exp: 2, iat: 1, scope: 'read' }));
    const token = `${header}.${payload}.signature`;
    mockedGetClientConfig.mockReturnValue({
      exampleApiTokenAudience: 'example',
      profileApiTokenAudience: 'profile',
      scope: 'openid',
      clientId: 'client',
    } as never);
    mockedUseClient.mockReturnValue({
      getApiToken: vi.fn((audience: string) =>
        audience === 'example' ? token : undefined,
      ),
      getUserTokens: vi.fn(() => ({ refresh: token })),
    } as never);

    render(<TokenBrowser />);
    expect(screen.getByText('Api token example')).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'Api token example' }));
    const decodedPayload = document.querySelector(
      '[data-test-id="decoded-token-payload"]',
    );
    expect(decodedPayload).toBeTruthy();
    expect(decodedPayload?.textContent).toContain('read');
    expect(
      document.querySelector('[data-test-id="encoded-token"]')?.textContent,
    ).toBe(token);
  });
});
