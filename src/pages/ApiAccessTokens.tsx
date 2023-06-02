import React, { useCallback, useEffect, useRef, useState } from 'react';
import PageContent from '../components/PageContent';
import AccessTokenOutput from '../components/AccessTokenOutput';
import { getClientConfig } from '../client';
import LoginInfo from '../components/LoginInfo';
import AuthenticatingInfo from '../components/AuthenticatingInfo';
import WithAuth from '../client/WithAuth';
import { useApiAccessTokens } from '../apiAccessTokens/useApiAccessTokens';

const TokenForm = ({
  audience,
  onCompletion
}: {
  audience: string;
  onCompletion: (audience: string) => void;
}): React.ReactElement => {
  const { getStatus, getTokenAsObject, getErrorMessage } = useApiAccessTokens(
    audience
  );
  const completionReportedRef = useRef(false);
  const status = getStatus();
  const isLoading = status === 'loading';
  const tokenObj = status === 'loaded' ? getTokenAsObject() : undefined;
  const isComplete = status === 'loaded' || status === 'error';

  useEffect(() => {
    if (isComplete && !completionReportedRef.current) {
      onCompletion(audience);
      completionReportedRef.current = true;
    }
  }, [isComplete, audience, onCompletion]);
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
          <span>Haetaan api tokenia...</span>
        </div>
      )}
      <AccessTokenOutput
        accessToken={tokenObj ? tokenObj[audience] : ''}
        audience={audience}
      />
    </div>
  );
};

const TokenFetcher = ({
  audiences
}: {
  audiences: string[];
}): React.ReactElement => {
  const [readyCount, updateReadyCount] = useState(0);
  const onCompletion = useCallback(
    audience => {
      const index = audiences.findIndex(aud => aud === audience);
      if (index > -1) {
        updateReadyCount(n => n + 1);
      }
    },
    [audiences]
  );
  return (
    <>
      {audiences.map((audience, index) => {
        if (index <= readyCount) {
          return (
            <TokenForm
              key={audience}
              audience={audience}
              onCompletion={onCompletion}
            />
          );
        }
        return null;
      })}
    </>
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
      <TokenFetcher
        audiences={[
          config.exampleApiTokenAudience,
          config.profileApiTokenAudience
        ]}
      />
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
