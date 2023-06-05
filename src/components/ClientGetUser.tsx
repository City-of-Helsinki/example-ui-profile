import to from 'await-to-js';
import React, { useEffect, useCallback, useState } from 'react';
import styles from './styles.module.css';
import { getClient } from '../client/oidc-react';
import { User } from '../client';

const ClientGetUser = (): React.ReactElement => {
  const [profileDataOrError, setLoadResult] = useState<
    User | Error | undefined
  >();
  const [status, setStatus] = useState<'loading' | 'error' | 'loaded'>(
    'loading'
  );
  const client = getClient();
  const loadProfile = useCallback(async () => {
    setStatus('loading');
    const [err, profile] = await to(client.loadUserProfile());
    if (err) {
      setStatus('error');
      setLoadResult(err);
    } else {
      setStatus('loaded');
      setLoadResult(profile);
    }
    return err ? Promise.reject(err) : Promise.resolve(profile);
  }, [client]);

  useEffect(() => {
    // useEffect itself cannot be async
    const load = async () => loadProfile();
    load();
  }, [loadProfile]);

  if (status === 'loading') {
    return <div>Ladataan....</div>;
  }

  return (
    <div>
      <h2>
        {status === 'error' ? 'User infon lataus epäonnistui' : 'User info'}
      </h2>
      <span className={styles.token}>
        {profileDataOrError && (
          <pre>
            {JSON.stringify(
              status === 'error'
                ? profileDataOrError
                : (profileDataOrError as User).profile,
              null,
              2
            )}
          </pre>
        )}
      </span>
    </div>
  );
};

export default ClientGetUser;
