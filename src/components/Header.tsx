import React, { useState, MouseEvent } from 'react';
import { IconSignout, Navigation } from 'hds-react';
import { useHistory, useLocation } from 'react-router-dom';
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
  const history = useHistory();
  const location = useLocation();
  const path = location.pathname.replace(pathPrefix, '');
  const currentPageFromPath: Page =
    path && path.length > 1 ? (path.substr(1) as Page) : 'frontpage';
  const [active, setActive] = useState<Page>(currentPageFromPath);

  const title = 'Helsinki Profiili Example';
  const userName = user ? `${user.given_name} ${user.family_name}` : '';

  const frontPageLink = (
    <Navigation.Item
      active={active === 'frontpage'}
      label="Etusivu"
      key="frontpage"
      tabIndex={0}
      onClick={(): void => {
        setActive('frontpage');
        history.push(pathPrefix);
      }}
      data-test-id="header-link-frontpage"
    />
  );

  const accessTokenLink = (
    <Navigation.Item
      active={active === 'apiAccessTokens'}
      as="button"
      label="Hae API access token"
      key="apiAccessTokens"
      type="button"
      onClick={(): void => {
        setActive('apiAccessTokens');
        history.push(`${pathPrefix}/apiAccessTokens`);
      }}
      data-test-id="header-link-apiAccessTokens"
    />
  );

  const userTokenLink = (
    <Navigation.Item
      active={active === 'userTokens'}
      as="button"
      label="Tokenit"
      key="userTokens"
      type="button"
      onClick={(): void => {
        setActive('userTokens');
        history.push(`${pathPrefix}/userTokens`);
      }}
      data-test-id="header-link-userTokens"
    />
  );

  const profileLink = (
    <Navigation.Item
      active={active === 'profile'}
      as="button"
      label="Profiili"
      key="profile"
      type="button"
      onClick={(): void => {
        setActive('profile');
        history.push(`${pathPrefix}/profile`);
      }}
      data-test-id="header-link-profile"
    />
  );
  const userInfoLink = (
    <Navigation.Item
      active={active === 'userinfo'}
      as="button"
      label="User info"
      key="userinfo"
      type="button"
      onClick={(): void => {
        setActive('userinfo');
        history.push(`${pathPrefix}/userinfo`);
      }}
      data-test-id="header-link-user-info"
    />
  );
  const backendLink = (
    <Navigation.Item
      active={active === 'backend'}
      as="button"
      label="Backend data"
      key="backend"
      type="button"
      onClick={(): void => {
        setActive('backend');
        history.push(`${pathPrefix}/backend`);
      }}
      data-test-id="header-link-backend"
    />
  );

  // <Navigation.Row> cannot not handle null/undefined as children.
  // That is why if..else cannot be used in <Navigation.Row>
  const links = currentConfig.hasApiTokenSupport
    ? [frontPageLink, accessTokenLink, userTokenLink, profileLink, backendLink]
    : [frontPageLink, userTokenLink, userInfoLink];

  return (
    <Navigation
      fixed={false}
      logoLanguage="fi"
      menuToggleAriaLabel="Close menu"
      theme="light"
      title={title}
      titleUrl="/"
      skipTo="#content"
      skipToContentLabel="Skip to main content">
      <Navigation.Row variant="inline">
        {links.map(link => link)}
      </Navigation.Row>
      <Navigation.Actions>
        {initialized && (
          <Navigation.User
            authenticated={authenticated}
            label="Kirjaudu sisään"
            onSignIn={(): void => client.login()}
            userName={userName}>
            <Navigation.Item
              href={`${config.ui.profileUIUrl}/loginsso`}
              label="Helsinki-profiili"
              target="_blank"
              className={styles['link-to-profile']}
            />
            <Navigation.Item
              onClick={(e: MouseEvent): void => {
                e.preventDefault();
                client.logout();
              }}
              variant="supplementary"
              label="Kirjaudu ulos"
              href="/logout"
              className={styles.navigationButton}
              icon={<IconSignout aria-hidden />}
            />
          </Navigation.User>
        )}
      </Navigation.Actions>
    </Navigation>
  );
};

export default Header;
