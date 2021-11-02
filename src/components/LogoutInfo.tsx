import React from 'react';
import { Button } from 'hds-react';
import styles from './styles.module.css';
import { useClient } from '../client/hooks';

const LogoutInfo = (): React.ReactElement => {
  const { logout, getUser } = useClient();
  const user = getUser();
  const name = user ? `${user.given_name} ${user.family_name}` : '';
  return (
    <div className={styles['content-element']} data-test-id="logout-info">
      <h3>
        Olet kirjautunut, <span data-test-id="logout-user-name">{name}</span>
      </h3>
      <div>
        <Button onClick={logout}>Kirjaudu ulos</Button>
      </div>
    </div>
  );
};

export default LogoutInfo;
