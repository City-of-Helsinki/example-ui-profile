import React from 'react';
import { useHistory } from 'react-router-dom';
import { Button } from 'hds-react';

import PageContent from '../components/PageContent';
import config from '../config';
import styles from '../components/styles.module.css';
import { ClientConfig } from '../client';

const ConfigSelector = (): React.ReactElement => {
  const history = useHistory();
  const changeConfig = (newConfig: ClientConfig): void => {
    history.push(newConfig.path);
  };
  const capitalize = (str: string) =>
    `${str.charAt(0).toUpperCase()}${str.substr(1)}`;
  return (
    <PageContent>
      <h1>Valitse kirjautumistapa</h1>
      <p>
        Voit kirjautua Helsinki-profiili MVP:n tai pelkän Suomi.fi:n kautta.
        Valitse ensin kumpaa käytät ja voit sen jälkeen kirjautua sisään.
      </p>
      <p>Kirjautumistapaa voi vaihtaa myöhemmin palaamalla tähän näkymään.</p>
      <div className={styles['button-container']}>
        <Button onClick={() => changeConfig(config.mvpConfig)}>
          {config.mvpConfig.label}
        </Button>
        <Button onClick={() => changeConfig(config.plainSuomiFiConfig)}>
          {capitalize(config.plainSuomiFiConfig.label)}
        </Button>
      </div>
    </PageContent>
  );
};

export default ConfigSelector;
