import React from 'react';
import { Button } from 'hds-react';
import {
  ProfileDataType,
  useProfileWithApiTokens,
  clearGraphQlClient
} from '../profile/profile';

import styles from './styles.module.css';
import { AnyObject } from '../common';

const nodeToJSON = (node: AnyObject): AnyObject | AnyObject[] => {
  if (Array.isArray(node.edges)) {
    return node.edges.map(edge => nodeToJSON(edge.node) as AnyObject);
  }
  if (node.__typename === 'VerifiedPersonalInformationNode') {
    return node;
  }
  return {
    id: String(node.id),
    value: String(
      node.address
        ? `${node.address} ${node.postalCode} ${node.city} ${node.countryCode}`
        : node.email || node.phone
    ),
    primary: String(node.primary)
  };
};

const PropToComponent = ([prop, value]: [
  string,
  ProfileDataType
]): React.ReactElement => (
  <li key={prop}>
    <strong>{prop}</strong>:{' '}
    {value && typeof value === 'object' ? (
      <pre data-test-id={`profile-data-${prop}`}>
        {JSON.stringify(nodeToJSON(value), null, 2)}
      </pre>
    ) : (
      <span data-test-id={`profile-data-${prop}`}>{value || '-'}</span>
    )}
  </li>
);

const Profile = (): React.ReactElement => {
  const {
    getApiTokenError,
    getApiTokenStatus,
    getData,
    getRequestStatus,
    getRequestError,
    request
  } = useProfileWithApiTokens();

  const apiAccessTokenStatus = getApiTokenStatus();
  const profileStatus = getRequestStatus();
  const profileData = getData();
  const resultErrorMessage = getRequestError();
  const reload = async (): Promise<void> => {
    await clearGraphQlClient();
    await request({});
  };
  if (apiAccessTokenStatus === 'error') {
    return (
      <div>
        Api access tokenin lataus epäonnistui
        <pre>{getApiTokenError()}</pre>
      </div>
    );
  }
  if (profileStatus === 'error') {
    return (
      <div data-test-id="profile-load-error">
        Profiilin lataus epäonnistui:
        <pre>{resultErrorMessage}</pre>
      </div>
    );
  }
  if (profileStatus !== 'loaded') {
    return <div>Ladataan....</div>;
  }
  return (
    <div>
      <h2>Profiilin tiedot:</h2>
      {profileData && (
        <ul className={styles['user-token-list']}>
          {Object.entries(profileData).map(arr => PropToComponent(arr))}
        </ul>
      )}
      {resultErrorMessage && (
        <p data-test-id="profile-data-result-error">{resultErrorMessage}</p>
      )}
      <Button onClick={reload}>Hae</Button>
    </div>
  );
};

export default Profile;
