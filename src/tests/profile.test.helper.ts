import fetchMock from '@fetch-mock/vitest';
import { AnyFunction, AnyObject } from '../common';
import { ProfileData } from '../profile/profile';
import { requestDelayForStatusChangeDetectionInMs } from '../client/__mocks__';

export const createValidProfileResponseData = (
  userData: AnyObject,
): ProfileData => ({ data: { myProfile: { ...userData } } });

export const mockProfileResponse = (options: {
  response: AnyObject;
  profileBackendUrl: string;
  delay?: number;
  requestCallback?: AnyFunction;
}): void => {
  const requestMock = fetchMock;
  const { response, delay, requestCallback, profileBackendUrl } = options;
  requestMock.once(profileBackendUrl, (callLog) => {
    const req =
      callLog.request ||
      new Request(callLog.url, callLog.options as RequestInit);
    if (requestCallback) {
      requestCallback(req);
    }
    return new Promise((resolve) =>
      setTimeout(() => {
        resolve(response);
      }, delay || requestDelayForStatusChangeDetectionInMs),
    );
  });
};

export const createValidProfileResponse = (
  overrides?: ProfileData,
): { status: number; body: string } => {
  const responseBody = createValidProfileResponseData({
    firstName: 'firstName',
    ...overrides,
  });
  return {
    status: 200,
    body: JSON.stringify(responseBody),
  };
};

export const createInvalidProfileResponse = (
  overrides?: ProfileData,
): { status: number; body: string } => {
  const responseBody = {
    ...overrides,
  };
  return {
    status: 401,
    body: JSON.stringify(responseBody),
  };
};
