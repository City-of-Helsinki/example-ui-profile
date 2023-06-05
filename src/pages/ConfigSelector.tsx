import React from 'react';
import { useHistory } from 'react-router-dom';
import { Button, Logo } from 'hds-react';

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
      <Logo size="medium" />
      <h1>Valitse kirjautumistapa</h1>
      <p>
        Tällä sivulla esitellään Helsinki-profiilin palvelukokonaisuutta
        esimerkkisovelluksen (Example App) avulla.
      </p>
      <p>
        Voit kirjautua Tunnistamo ja Helsinki Tunnistus -palveluiden kautta.
        Valitse ensin kumpaa käytät ja voit sen jälkeen kirjautua sisään.
      </p>
      <p>Kirjautumistapaa voi vaihtaa myöhemmin palaamalla tähän näkymään.</p>
      <div className={styles['button-container']}>
        <Button onClick={() => changeConfig(config.tunnistamoConfig)}>
          Kirjaudu {config.tunnistamoConfig.label}-palvelussa
        </Button>
        <Button onClick={() => changeConfig(config.keycloakConfig)}>
          Kirjaudu {capitalize(config.keycloakConfig.label)} -palvelussa
        </Button>
      </div>
    </PageContent>
  );
};

export default ConfigSelector;
