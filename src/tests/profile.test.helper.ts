import { FetchMock } from 'jest-fetch-mock';
import { AnyFunction, AnyObject } from '../common';
import { ProfileData } from '../profile/profile';
import { requestDelayForStatusChangeDetectionInMs } from '../client/__mocks__';

export const createValidProfileResponseData = (
  userData: AnyObject
): ProfileData => ({ data: { myProfile: { ...userData } } });

export const mockProfileResponse = (options: {
  response: AnyObject;
  profileBackendUrl: string;
  delay?: number;
  requestCallback?: AnyFunction;
}): void => {
  const fetchMock: FetchMock = global.fetch;
  const { response, delay, requestCallback, profileBackendUrl } = options;
  fetchMock.doMockOnceIf(profileBackendUrl, req => {
    if (requestCallback) {
      requestCallback(req);
    }
    return new Promise(resolve =>
      setTimeout(() => {
        resolve(response);
      }, delay || requestDelayForStatusChangeDetectionInMs)
    );
  });
};

export const getProfileData = (): ProfileData => ({
  id: 'id',
  firstName: 'firstName',
  lastName: 'lastName',
  nickname: 'nickname',
  language: 'fi',
  primaryEmail: null,
  primaryAddress: null,
  primaryPhone: null,
  addresses: null,
  emails: null,
  phones: null,
  verifiedPersonalInformation: null
});

export const createValidProfileResponse = (
  overrides?: ProfileData
): { status: number; body: string } => {
  const responseBody = createValidProfileResponseData({
    ...getProfileData(),
    firstName: 'firstName',
    ...overrides
  });
  return {
    status: 200,
    body: JSON.stringify(responseBody)
  };
};

export const createInvalidProfileResponse = (
  overrides?: ProfileData
): { status: number; body: string } => {
  const responseBody = {
    ...overrides
  };
  return {
    status: 401,
    body: JSON.stringify(responseBody)
  };
};
