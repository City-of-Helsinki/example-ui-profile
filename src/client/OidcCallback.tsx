import React from 'react';
import { Navigate } from 'react-router';

import { useClientCallback } from './hooks';

export type OidcCallbackProps = {
  successRedirect: string;
  failureRedirect: string;
};

const OidcCallback = (props: OidcCallbackProps): React.ReactElement => {
  const client = useClientCallback();
  const initialized = client.isInitialized();
  const authenticated = client.isAuthenticated();
  if (!initialized) {
    return <div>Tarkistetaan kirjautumistietoja...</div>;
  }
  return authenticated ? (
    <Navigate to={props.successRedirect} replace />
  ) : (
    <Navigate to={props.failureRedirect} replace />
  );
};

export default OidcCallback;
