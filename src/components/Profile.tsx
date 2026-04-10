import React from 'react';
import { Button } from 'hds-react';
import {
  ProfileDataType,
  useProfileWithApiTokens,
  clearGraphQlClient,
} from '../profile/profile';

import styles from './styles.module.css';
import { AnyObject } from '../common';
const typeNameProp = '__typename';

const sanitizeNode = (node: AnyObject): AnyObject => {
  const objectEntries = Object.entries(node);

  return Object.fromEntries(
    objectEntries
      .filter(
        ([key, value]) =>
          value !== null && value !== undefined && key !== typeNameProp,
      )
      .map(([key, value]) => [
        key,
        typeof value === 'object' ? sanitizeNode(value as AnyObject) : value,
      ]),
  );
};

const nodeToJSON = (node: AnyObject): AnyObject | AnyObject[] => {
  if (Array.isArray(node.edges)) {
    return node.edges.map((edge) => nodeToJSON(edge.node) as AnyObject);
  }
  return sanitizeNode(node);
};

const PropToComponent = ([prop, value]: [
  string,
  ProfileDataType,
]): React.ReactElement | null => {
  if (prop === typeNameProp) {
    return null;
  }
  return (
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
};

const Profile = (): React.ReactElement => {
  const {
    getApiTokenError,
    getApiTokenStatus,
    getData,
    getRequestStatus,
    getRequestError,
    request,
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
          {Object.entries(profileData).map((arr) => PropToComponent(arr))}
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
