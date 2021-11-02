import React, { useState, useEffect } from 'react';
import { Button, TextInput } from 'hds-react';
import styles from './styles.module.css';
import { useBackendWithApiTokens } from '../backend/backend';

const BackendDataEditor = (): React.ReactElement => {
  const {
    getApiTokenStatus,
    getRequestStatus,
    getData,
    request,
    getApiTokenError,
    getRequestError
  } = useBackendWithApiTokens();

  const apiTokenStatus = getApiTokenStatus();
  const requestStatus = getRequestStatus();
  const data = getData();
  const currentPetName = data?.pet_name;
  const [newPetName, setNewPetName] = useState<string | null>(null);

  const save = async () => {
    await request({ data: { pet_name: newPetName as string } });
  };

  useEffect(() => {
    if (data && newPetName === null) {
      setNewPetName(currentPetName || '');
    }
  }, [data, newPetName, currentPetName]);

  if (apiTokenStatus === 'error') {
    return (
      <div>
        Api access tokenin lataus epäonnistui:
        <pre>{getApiTokenError()}</pre>
      </div>
    );
  }
  if (requestStatus === 'error') {
    return (
      <div data-test-id="backend-load-error">
        Backend-haku epäonnistui:
        <pre>{getRequestError()}</pre>
      </div>
    );
  }
  if (requestStatus !== 'loaded' && newPetName === null) {
    return <div>Ladataan....</div>;
  }
  return (
    <div className={styles['content-element']} data-test-id="backend-data">
      <h3>Backend data</h3>
      <form
        className={styles['pet-name-form']}
        onSubmit={e => {
          e.preventDefault();
          save();
        }}>
        <div>
          Tallennettu lemmikin nimi:{' '}
          {currentPetName || '(Ei tallennettua nimeä)'}
        </div>
        <TextInput
          label="Uusi lemmikin nimi:"
          id="petName"
          type="text"
          value={newPetName || ''}
          onChange={e => setNewPetName(e.currentTarget.value)}
        />
        <Button onClick={() => save()}>Tallenna</Button>
        {requestStatus === 'loading' && <p>Tallennetaan...</p>}
      </form>
    </div>
  );
};

export default BackendDataEditor;
