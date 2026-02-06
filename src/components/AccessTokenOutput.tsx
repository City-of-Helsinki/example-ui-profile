/* eslint-disable react/require-default-props */
import React from 'react';
import styles from './styles.module.css';

const AccessTokenOutput = (props: {
  accessToken?: string;
  audience: string;
}): React.ReactElement | null => {
  const { accessToken, audience } = props;

  if (!accessToken) {
    return null;
  }
  return (
    <div className={styles['access-token-output']}>
      <h2>Audience</h2>
      <span
        className={styles.token}
        data-test-id={`${audience}-api-access-token-audience`}>
        {audience}
      </span>
      <h2>Token</h2>
      <span
        className={styles.token}
        data-test-id={`${audience}-api-access-token-output`}>
        {accessToken}
      </span>
    </div>
  );
};

export default AccessTokenOutput;
