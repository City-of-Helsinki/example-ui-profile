import React from 'react';
import { Navigate, Route, Routes } from 'react-router';

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
            <Routes>
              <Route
                path="/"
                element={<Navigate to={keycloakPath} replace />}
              />
              <Route path={keycloakPath} element={<Index />} />
              <Route path="/:anyPath/userTokens" element={<Tokens />} />
              <Route path="/:anyPath/userinfo" element={<UserInfo />} />
              <Route
                path="/:anyPath/apiAccessTokens"
                element={<ApiAccessTokens />}
              />
              <Route path="/:anyPath/backend" element={<BackendData />} />
              <Route path="/:anyPath/profile" element={<ProfilePage />} />
              <Route
                path="/authError"
                element={<div>Autentikaatio epäonnistui</div>}
              />
              <Route path="/logout" element={<LogOut />} />
              <Route path="*" element={<>404 - not found</>} />
            </Routes>
          </PageContainer>
        </StoreProvider>
      </ClientProvider>
    </HandleCallback>
  );
}
export default App;
