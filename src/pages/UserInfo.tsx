import React from 'react';
import PageContent from '../components/PageContent';
import ClientGetUser from '../components/ClientGetUser';
import LoginInfo from '../components/LoginInfo';
import AuthenticatingInfo from '../components/AuthenticatingInfo';
import WithAuth from '../client/WithAuth';

const UserInfo = (): React.ReactElement => (
  <PageContent>
    {WithAuth(ClientGetUser, LoginInfo, AuthenticatingInfo)}
  </PageContent>
);

export default UserInfo;
