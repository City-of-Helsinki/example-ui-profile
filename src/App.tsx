import React from 'react';
import { Switch, Route, Redirect } from 'react-router';

import { ClientProvider } from './client/ClientProvider';
import StoreProvider from './client/redux/StoreProvider';
import PageContainer from './components/PageContainer';
import HandleCallback from './components/HandleCallback';
import config from './config';
import Index from './pages/Index';
import Tokens from './pages/Tokens';
import Header from './components/Header';
import UserInfo from './pages/UserInfo';
import ApiAccessTokens from './pages/ApiAccessTokens';
import ProfilePage from './pages/ProfilePage';
import BackendData from './pages/BackendData';
import LogOut from './pages/LogOut';
import { setClientConfig } from './client';

setClientConfig(config.keycloakConfig);

function App(): React.ReactElement {
  const keycloakPath = config.keycloakConfig.path;

  return (
    <HandleCallback>
      <ClientProvider>
        <StoreProvider>
          <PageContainer>
            <Header />
            <Switch>
              <Route path={'/'} exact>
                <Redirect to={keycloakPath} />
              </Route>
              <Route path={[keycloakPath]} exact>
                <Index />
              </Route>
              <Route path={['/:anyPath/userTokens']} exact>
                <Tokens />
              </Route>
              <Route path={[`/:anyPath/userinfo`]} exact>
                <UserInfo />
              </Route>
              <Route path={[`/:anyPath/apiAccessTokens`]} exact>
                <ApiAccessTokens />
              </Route>
              <Route path={[`/:anyPath/backend`]} exact>
                <BackendData />
              </Route>
              <Route path={[`/:anyPath/profile`]} exact>
                <ProfilePage />
              </Route>
              <Route path={['/authError']} exact>
                <div>Autentikaatio epäonnistui</div>
              </Route>
              <Route path={['/logout']} exact>
                <LogOut />
              </Route>
              <Route path="*">404 - not found</Route>
            </Switch>
          </PageContainer>
        </StoreProvider>
      </ClientProvider>
    </HandleCallback>
  );
}
export default App;
