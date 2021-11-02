import React from 'react';
import { Button } from 'hds-react';
import styles from './styles.module.css';
import { useClient } from '../client/hooks';

const LoginInfo = (): React.ReactElement => {
  const { login } = useClient();
  return (
    <div className={styles['content-element']} data-test-id="login-info">
      <h3>Et ole kirjautunut</h3>
      <div>
        <Button onClick={login} data-test-id="login-button">
          Kirjaudu sisään
        </Button>
      </div>
    </div>
  );
};

export default LoginInfo;
