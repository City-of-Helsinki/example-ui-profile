import fetchMock from '@fetch-mock/vitest';
import { AnyObject } from '../common';

type FetchMock = typeof fetchMock;

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
  const routeName = `backend-route:${backendUrl}`;
  const setRequestMockResponse = (props: MockResponseProps = {}) => {
    fetchMock.removeRoute(routeName);
    fetchMock.route(
      backendUrl,
      async () => {
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
      },
      {
        name: routeName,
      },
    );
  };
  return (props) => {
    setRequestMockResponse(props);
  };
}
