import React, { useState } from 'react';
import {
  Header as HdsHeader,
  IconSignin,
  IconSignout,
  Logo,
  logoFi,
} from 'hds-react';
import { useLocation, useNavigate } from 'react-router';
import { useClient } from '../client/hooks';
import styles from './styles.module.css';
import { getClientConfig } from '../client';
import config from '../config';

type Page =
  | 'frontpage'
  | 'apiAccessTokens'
  | 'userTokens'
  | 'profile'
  | 'userinfo'
  | 'backend';

const Header = (): React.ReactElement => {
  const currentConfig = getClientConfig();
  const pathPrefix = currentConfig.path;
  const client = useClient();
  const authenticated = client.isAuthenticated();
  const initialized = client.isInitialized();
  const user = client.getUser();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname.replace(pathPrefix, '');
  const currentPageFromPath: Page =
    path && path.length > 1 ? (path.substr(1) as Page) : 'frontpage';
  const [active, setActive] = useState<Page>(currentPageFromPath);

  const title = 'Helsinki Profiili Example';
  const userName = user ? `${user.given_name} ${user.family_name}` : '';
  const navigateTo =
    (page: Page, destination: string) => (event: React.MouseEvent) => {
      event.preventDefault();
      setActive(page);
      navigate(destination);
    };

  return (
    <HdsHeader theme="light">
      <HdsHeader.ActionBar
        frontPageLabel="Etusivu"
        logo={<Logo src={logoFi} alt="Helsingin kaupunki" />}
        logoAriaLabel="Helsingin kaupunki"
        logoHref={pathPrefix}
        title={title}
        titleHref={pathPrefix}
        titleStyle={HdsHeader.TitleStyleType.Bold}
        menuButtonAriaLabel="Avaa valikko">
        {initialized &&
          (authenticated ? (
            <>
              <HdsHeader.ActionBarItem
                id="user"
                label={userName}
                fixedRightPosition
              />
              <HdsHeader.ActionBarButton
                id="logout"
                label="Kirjaudu ulos"
                icon={<IconSignout aria-hidden />}
                onClick={(): void => client.logout()}
              />
            </>
          ) : (
            <HdsHeader.ActionBarButton
              id="login"
              label="Kirjaudu sisään"
              icon={<IconSignin aria-hidden />}
              className={styles.loginButton}
              onClick={(): void => client.login()}
            />
          ))}
      </HdsHeader.ActionBar>
      <HdsHeader.NavigationMenu>
        <HdsHeader.Link
          href={pathPrefix}
          label="Etusivu"
          active={active === 'frontpage'}
          onClick={navigateTo('frontpage', pathPrefix)}
          data-test-id="header-link-frontpage"
        />
        <HdsHeader.Link
          href={`${pathPrefix}/apiAccessTokens`}
          label="Hae API access token"
          active={active === 'apiAccessTokens'}
          onClick={navigateTo(
            'apiAccessTokens',
            `${pathPrefix}/apiAccessTokens`,
          )}
          data-test-id="header-link-apiAccessTokens"
        />
        <HdsHeader.Link
          href={`${pathPrefix}/userTokens`}
          label="Tokenit"
          active={active === 'userTokens'}
          onClick={navigateTo('userTokens', `${pathPrefix}/userTokens`)}
          data-test-id="header-link-userTokens"
        />
        <HdsHeader.Link
          href={`${pathPrefix}/userinfo`}
          label="User info"
          active={active === 'userinfo'}
          onClick={navigateTo('userinfo', `${pathPrefix}/userinfo`)}
          data-test-id="header-link-user-info"
        />
        <HdsHeader.Link
          href={`${pathPrefix}/profile`}
          label="Profiili"
          active={active === 'profile'}
          onClick={navigateTo('profile', `${pathPrefix}/profile`)}
          data-test-id="header-link-profile"
        />
        <HdsHeader.Link
          href={`${pathPrefix}/backend`}
          label="Backend data"
          active={active === 'backend'}
          onClick={navigateTo('backend', `${pathPrefix}/backend`)}
          data-test-id="header-link-backend"
        />
        {initialized && authenticated && (
          <HdsHeader.Link
            href={`${config.ui.profileUIUrl}/loginsso`}
            label="Helsinki-profiili"
            target="_blank"
            className={styles['link-to-profile']}
          />
        )}
      </HdsHeader.NavigationMenu>
    </HdsHeader>
  );
};

export default Header;
