import type { Mock } from 'vitest';
import { HttpPoller, HttpPollerProps } from '../http-poller';

type MockHttpPollerData = {
  start: Mock;
  stop: Mock;
  props?: HttpPollerProps;
};

type GlobalWithPollerData = typeof globalThis & {
  mockHttpPoller: MockHttpPollerData;
};

const globalWithPollerData = global as unknown as GlobalWithPollerData;

if (!globalWithPollerData.mockHttpPoller) {
  globalWithPollerData.mockHttpPoller = {
    start: vi.fn(),
    stop: vi.fn(),
    props: undefined,
  };
}
const { mockHttpPoller } = globalWithPollerData;

export function getHttpPollerMockData(): MockHttpPollerData {
  return mockHttpPoller;
}

export default function createHttpPoller(
  pollerProps: HttpPollerProps,
): HttpPoller {
  mockHttpPoller.start.mockReset();
  mockHttpPoller.stop.mockReset();
  mockHttpPoller.props = pollerProps;
  return {
    start: () => {
      mockHttpPoller.start();
    },
    stop: () => {
      mockHttpPoller.stop();
    },
  };
}
