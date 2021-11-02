import React from 'react';

import { Button } from 'hds-react';
import { Link, useLocation } from 'react-router-dom';
import config from '../config';
import { getClientConfig, setClientConfig, ClientConfig } from '../client';
import ConfigSelection from '../pages/ConfigSelector';
import PageContent from './PageContent';
import { getClient } from '../client/oidc-react';

const ConfigChecker = (
  props: React.PropsWithChildren<unknown>
): React.ReactElement => {
  const { children } = props;
  const { getConfigFromRoute } = config;

  const currentConfig = getClientConfig();
  const location = useLocation();
  const configFromRoute = getConfigFromRoute(location.pathname);
  if (!currentConfig && !configFromRoute) {
    return <ConfigSelection />;
  }
  const configSetFromRoute =
    !currentConfig && configFromRoute
      ? setClientConfig(configFromRoute)
      : undefined;
  const activeConfig = configSetFromRoute || currentConfig;
  const switchConfig = (newConfig: ClientConfig) => {
    document.location.href = newConfig.path;
  };
  const isLoggedIn = (): boolean => {
    if (!activeConfig) {
      return false;
    }
    return getClient().isAuthenticated();
  };
  const logout = (): void => {
    getClient().logout();
  };
  if (activeConfig !== configFromRoute) {
    const swapped =
      activeConfig.path === config.mvpConfig.path
        ? config.plainSuomiFiConfig
        : config.mvpConfig;
    return (
      <PageContent>
        <div>
          <h1>Kirjautumistavan vaihto</h1>
          {isLoggedIn() ? (
            <div>
              <p>
                Olet jo kirjautunut ja kirjautumistapa on {currentConfig.label}
              </p>
              <p>Jos haluat vaihtaa kirjautumistapaa, kirjaudu ensin ulos.</p>
              <Button onClick={() => logout()}>Kirjaudu ulos</Button>
            </div>
          ) : (
            <>
              <p>Nykyinen kirjautumistapa on {currentConfig.label}</p>
              <Button onClick={() => switchConfig(swapped)}>
                Vaihda kirjautumistavaksi {swapped.label}
              </Button>
            </>
          )}
          <p>
            <Link to={currentConfig.path}>
              Tai jatka vanhalla kirjatumistavalla.
            </Link>
          </p>
        </div>
      </PageContent>
    );
  }
  return <>{children}</>;
};

export default ConfigChecker;
