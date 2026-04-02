import { FetchMock } from 'jest-fetch-mock';
import { AnyObject } from '../common';

export type MockResponseProps = {
  return401?: boolean;
  causeException?: boolean;
  responseData?: AnyObject;
};

export default function initMockResponses(
  fetchMock: FetchMock,
  backendUrl: string,
  defaultResponse?: AnyObject,
): (props?: MockResponseProps) => void {
  const setRequestMockResponse = (props: MockResponseProps = {}) => {
    fetchMock.mockIf(backendUrl, async () => {
      const { return401, causeException, responseData } = props;
      if (causeException) {
        return Promise.resolve({
          status: 200,
          body: 'this_is_malformed_json}',
        });
      }
      if (return401) {
        return Promise.resolve({
          status: 401,
          body: 'forbidden',
        });
      }
      return Promise.resolve({
        status: 200,
        body: JSON.stringify(responseData || defaultResponse),
      });
    });
  };
  return (props) => {
    setRequestMockResponse(props);
  };
}
