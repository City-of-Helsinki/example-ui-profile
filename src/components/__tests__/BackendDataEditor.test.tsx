import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BackendDataEditor from '../BackendDataEditor';

const mockedUseBackendWithApiTokens = vi.hoisted(() => vi.fn());

vi.mock('../../backend/backend', () => ({
  useBackendWithApiTokens: mockedUseBackendWithApiTokens,
}));

type BackendMockState = {
  apiTokenStatus: string;
  requestStatus: string;
  data?: { pet_name: string };
  apiTokenError?: string;
  requestError?: string;
  request: ReturnType<typeof vi.fn>;
};

const createBackendMock = (
  overrides: Partial<BackendMockState> = {},
): BackendMockState => {
  const state: BackendMockState = {
    apiTokenStatus: 'ready',
    requestStatus: 'waiting',
    request: vi.fn(),
    ...overrides,
  };
  mockedUseBackendWithApiTokens.mockReturnValue({
    getApiTokenStatus: () => state.apiTokenStatus,
    getRequestStatus: () => state.requestStatus,
    getData: () => state.data,
    getApiTokenError: () => state.apiTokenError,
    getRequestError: () => state.requestError,
    request: state.request,
  });
  return state;
};

describe('BackendDataEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders API token and backend errors', () => {
    createBackendMock({
      apiTokenStatus: 'error',
      apiTokenError: 'token failed',
    });
    const { rerender } = render(<BackendDataEditor />);
    expect(
      screen.getByText(/Api access tokenin lataus epäonnistui/),
    ).toBeTruthy();
    expect(screen.getByText('token failed')).toBeTruthy();

    createBackendMock({
      requestStatus: 'error',
      requestError: 'backend failed',
    });
    rerender(<BackendDataEditor />);
    expect(
      document.querySelector('[data-test-id="backend-load-error"]'),
    ).toBeTruthy();
    expect(screen.getByText('backend failed')).toBeTruthy();
  });

  it('renders loading and editable loaded data', async () => {
    createBackendMock();
    const { rerender } = render(<BackendDataEditor />);
    expect(screen.getByText('Ladataan....')).toBeTruthy();

    createBackendMock({
      requestStatus: 'loaded',
      data: { pet_name: 'Rolle' },
    });
    rerender(<BackendDataEditor />);
    await waitFor(() => expect(screen.getByDisplayValue('Rolle')).toBeTruthy());
    expect(screen.getByText(/Tallennettu lemmikin nimi: Rolle/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Uusi lemmikin nimi:'), {
      target: { value: 'Muru' },
    });
    expect(screen.getByDisplayValue('Muru')).toBeTruthy();
  });

  it('submits the edited pet name and shows saving state', async () => {
    const state = createBackendMock({
      requestStatus: 'loading',
      data: { pet_name: '' },
    });
    render(<BackendDataEditor />);
    await waitFor(() =>
      expect(
        document.querySelector('[data-test-id="backend-data"]'),
      ).toBeTruthy(),
    );
    fireEvent.change(screen.getByLabelText('Uusi lemmikin nimi:'), {
      target: { value: 'Muru' },
    });
    fireEvent.submit(document.querySelector('form') as HTMLFormElement);
    expect(state.request).toHaveBeenCalledWith({ data: { pet_name: 'Muru' } });
    expect(screen.getByText('Tallennetaan...')).toBeTruthy();
  });
});
