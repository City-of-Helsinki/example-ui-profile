import React from 'react';
import PageContent from '../components/PageContent';
import AccessTokenOutput from '../components/AccessTokenOutput';
import { getClientConfig } from '../client';
import LoginInfo from '../components/LoginInfo';
import AuthenticatingInfo from '../components/AuthenticatingInfo';
import WithAuth from '../client/WithAuth';
import { useApiAccessTokens } from '../apiAccessTokens/useApiAccessTokens';

const TokenForm = ({ audience }: { audience: string }): React.ReactElement => {
  const { getStatus, getTokenAsObject, getErrorMessage } = useApiAccessTokens(
    audience
  );
  const status = getStatus();
  const isLoading = status === 'loading';
  const tokenObj = status === 'loaded' ? getTokenAsObject() : undefined;

  return (
    <div>
      {status === 'error' && (
        <div>
          <p data-test-id="api-access-token-error">
            Api access tokenin haku epäonnistui {getErrorMessage()}
          </p>
        </div>
      )}
      {isLoading && (
        <div>
          <span>Haetaan...</span>
        </div>
      )}
      <AccessTokenOutput
        accessToken={tokenObj ? tokenObj[audience] : ''}
        audience={audience}
      />
    </div>
  );
};

const UnauthenticatedContent = (): React.ReactElement => (
  <PageContent>
    <LoginInfo />
  </PageContent>
);
const AuthenticatedContent = (): React.ReactElement => {
  const config = getClientConfig();
  return (
    <PageContent>
      <h1>API Access tokeneiden haku</h1>
      <TokenForm audience={config.exampleApiTokenAudience} />
      <TokenForm audience={config.profileApiTokenAudience} />
    </PageContent>
  );
};

const ApiAccessTokens = (): React.ReactElement =>
  WithAuth(
    () => <AuthenticatedContent />,
    UnauthenticatedContent,
    AuthenticatingInfo
  );

export default ApiAccessTokens;
