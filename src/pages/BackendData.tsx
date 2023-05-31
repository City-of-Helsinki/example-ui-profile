import React from 'react';
import PageContent from '../components/PageContent';
import LoginInfo from '../components/LoginInfo';
import AuthenticatingInfo from '../components/AuthenticatingInfo';
import WithAuth from '../client/WithAuth';
import BackendDataEditor from '../components/BackendDataEditor';

const BackendData = (): React.ReactElement => (
  <PageContent>
    {WithAuth(BackendDataEditor, LoginInfo, AuthenticatingInfo)}
  </PageContent>
);

export default BackendData;
