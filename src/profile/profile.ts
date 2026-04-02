import to from 'await-to-js';
import { GraphQLError } from 'graphql';
import { useCallback } from 'react';
import { ApolloError, gql } from '@apollo/client';
import {
  GraphQLClient,
  createGraphQLClient,
  GraphQLClientError,
  resetClient,
} from '../graphql/graphqlClient';
import { AnyObject } from '../common';

import useAuthorizedApiRequests, {
  AuthorizedRequest,
  AuthorizedApiActions,
} from '../apiAccessTokens/useAuthorizedApiRequests';
import { getClientConfig } from '../client';

const MY_PROFILE_QUERY = gql`
  query MyProfileQuery {
    myProfile {
      id
      firstName
      lastName
      nickname
      language
      primaryAddress {
        id
        primary
        address
        postalCode
        city
        countryCode
        addressType
      }
      addresses {
        edges {
          node {
            primary
            id
            address
            postalCode
            city
            countryCode
            addressType
          }
        }
      }
      primaryEmail {
        id
        email
        primary
        emailType
        verified
      }
      emails {
        edges {
          node {
            primary
            id
            email
            emailType
            verified
          }
        }
      }
      primaryPhone {
        id
        phone
        primary
        phoneType
      }
      phones {
        edges {
          node {
            primary
            id
            phone
            phoneType
          }
        }
      }
      verifiedPersonalInformation {
        firstName
        lastName
        givenName
        nationalIdentificationNumber
        municipalityOfResidence
        municipalityOfResidenceNumber
        permanentAddress {
          streetAddress
          postalCode
          postOffice
        }
        temporaryAddress {
          streetAddress
          postalCode
          postOffice
        }
        permanentForeignAddress {
          streetAddress
          additionalAddress
          countryCode
        }
      }
    }
  }
`;

let profileGqlClient: GraphQLClient | undefined;

export type ProfileDataType = string | AnyObject | undefined;
export type ProfileErrorType = Error | GraphQLClientError | string | undefined;
export type ProfileData = Record<string, ProfileDataType>;
export type ProfileQueryResult = {
  data: {
    myProfile: GraphQLProfile;
  };
  errors?: readonly GraphQLError[];
};
export type GraphQLProfile =
  | Record<string, { edges: { node: { email: string } }[] }>
  | undefined;

type ReturnData = ProfileData;
type FetchProps = { autoFetch: boolean } | undefined;
type Request = AuthorizedRequest<ReturnData, FetchProps>;
export type ProfileActions = AuthorizedApiActions<ReturnData, FetchProps>;

export function getProfileGqlClient(token?: string): GraphQLClient | undefined {
  if (!profileGqlClient) {
    const uri = window._env_.REACT_APP_PROFILE_BACKEND_URL;
    if (!token || !uri) {
      return undefined;
    }
    profileGqlClient = createGraphQLClient(uri, token);
  }
  return profileGqlClient;
}

export function convertQueryToData(
  queryResult: ProfileQueryResult,
): ProfileData | undefined {
  const profile = queryResult && queryResult.data && queryResult.data.myProfile;
  if (!profile) {
    return undefined;
  }
  const { id, firstName, lastName, nickname, language } = profile;
  const getEmail = (data: GraphQLProfile): string | undefined => {
    const list = data?.emails?.edges;
    return list && list[0] && list[0].node?.email;
  };
  return {
    id,
    firstName,
    lastName,
    nickname,
    language,
    email: getEmail(profile),
  };
}

export async function getProfileData(
  token?: string,
): Promise<ProfileQueryResult | GraphQLClientError> {
  const client = getProfileGqlClient(token);
  if (!client) {
    return {
      error: new Error(
        'getProfileGqlClient returned undefined. Missing ApiToken for env.REACT_APP_<oidc provider>_PROFILE_API_TOKEN_AUDIENCE or missing env.REACT_APP_PROFILE_BACKEND_URL ',
      ),
    };
  }
  const [error, result]: [
    Error | ApolloError | null,
    ProfileQueryResult | undefined,
  ] = await to(
    client.query({
      errorPolicy: 'all',
      query: MY_PROFILE_QUERY,
      fetchPolicy: 'no-cache',
    }),
  );
  if (error || !result) {
    return {
      error: error || undefined,
      message: 'Query error',
    };
  }
  const data = convertQueryToData(result);
  if (!data) {
    return {
      error: result.errors
        ? result.errors[0]
        : new Error('Query result is missing data.myProfile'),
    };
  }
  return result;
}

export async function clearGraphQlClient(): Promise<void> {
  const client = getProfileGqlClient();
  if (client) {
    await resetClient(client);
    profileGqlClient = undefined;
  }
  return Promise.resolve();
}

const executeAPIAction: Request = async (options) => {
  const result = await getProfileData(options.token);
  const resultAsError = result as GraphQLClientError;
  if (resultAsError.error) {
    throw resultAsError.error;
  } else if (resultAsError.message) {
    throw new Error(resultAsError.message);
  }
  return (result as ProfileQueryResult).data.myProfile as ProfileData;
};

export function useProfileWithApiTokens(): ProfileActions {
  const req: Request = useCallback(
    async (props) => executeAPIAction(props),
    [],
  );
  const config = getClientConfig();
  return useAuthorizedApiRequests(req, {
    audience: config.profileApiTokenAudience,
    autoFetchProps: {},
  });
}
