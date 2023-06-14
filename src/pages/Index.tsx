import React, { useContext } from 'react';
import { ClientContext } from '../client/ClientProvider';
import LoginComponent from '../components/Login';
import PageContent from '../components/PageContent';
import ReduxConsumer from '../components/ReduxConsumer';
import WithAuthDemo from '../components/WithAuthDemo';
import ClientConsumer from '../components/ClientConsumer';
import { getClientConfig } from '../client';
import { useClient } from '../client/hooks';

const Index = (): React.ReactElement => {
  const currentConfig = getClientConfig();
  const clientContext = useContext(ClientContext);
  const client = useClient();
  return (
    <PageContent>
      {!!clientContext && clientContext.client ? (
        <>
          <h1>Client-demo </h1>
          <p>
            Olet {client.isAuthenticated() ? 'kirjautunut' : 'kirjautumassa'}{' '}
            <strong>{currentConfig.label} -palvelun kautta.</strong>
          </p>
          <p>
            Tässä demossa näytetään kirjautumisikkuna ja komponentteja, jotka
            kuuntelevat muutoksia kirjautumisessa.
          </p>
          <p>
            Voit kirjautua sisään / ulos alla olevasta komponentista tai
            headerista.
          </p>
          <p>Voit myös kirjautua ulos toisessa ikkunassa.</p>
          <LoginComponent />
          <ReduxConsumer />
          <WithAuthDemo />
          <ClientConsumer />
        </>
      ) : (
        <div>Error:Clientia ei löydy contextista</div>
      )}
    </PageContent>
  );
};

export default Index;
